#!/usr/bin/env python3
"""Read-only Google Analytics Data API reports for Measure Garden."""

from __future__ import annotations

import argparse
import atexit
import os
import ssl
import sys
import tempfile
import unicodedata
from collections.abc import Iterable, Sequence
from pathlib import Path

import certifi


def configure_windows_grpc_roots() -> None:
    """Let gRPC validate TLS with certifi plus the Windows root store."""
    if os.name != "nt" or os.getenv("GRPC_DEFAULT_SSL_ROOTS_FILE_PATH"):
        return

    roots = [
        ssl.DER_cert_to_PEM_cert(certificate)
        for certificate, encoding, _trust in ssl.enum_certificates("ROOT")
        if encoding == "x509_asn"
    ]
    handle = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="ascii",
        prefix="measure-garden-grpc-roots-",
        suffix=".pem",
        delete=False,
    )
    with handle:
        handle.write(Path(certifi.where()).read_text(encoding="ascii"))
        handle.write("\n")
        handle.write("".join(roots))

    bundle_path = handle.name
    os.environ["GRPC_DEFAULT_SSL_ROOTS_FILE_PATH"] = bundle_path

    def remove_bundle() -> None:
        try:
            Path(bundle_path).unlink(missing_ok=True)
        except OSError:
            pass

    atexit.register(remove_bundle)


configure_windows_grpc_roots()

import google.auth
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    RunRealtimeReportRequest,
    RunReportRequest,
)
from google.auth.credentials import Credentials
from google.auth.exceptions import DefaultCredentialsError, RefreshError
from google.auth.transport.requests import Request
from google.api_core.exceptions import GoogleAPICallError, PermissionDenied


READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
REPORT_START_DATE = "2026-06-01"
REPORT_DATE_RANGE = DateRange(start_date=REPORT_START_DATE, end_date="today")
MEASUREMENT_ID_PREFIX = "G-"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="GA4 Data APIの主要指標を読み取り専用で表示します。"
    )
    parser.add_argument(
        "--check-auth",
        action="store_true",
        help="Application Default Credentialsの取得と更新だけを確認します。",
    )
    return parser.parse_args()


def load_readonly_credentials() -> tuple[Credentials, str | None]:
    credentials, project_id = google.auth.default(scopes=[READONLY_SCOPE])
    credentials.refresh(Request())
    return credentials, project_id


def require_property_id() -> str:
    property_id = os.getenv("GA_PROPERTY_ID", "").strip()
    if not property_id:
        raise ValueError(
            "環境変数 GA_PROPERTY_ID が未設定です。"
            "GA4の数値プロパティIDを設定してください。"
        )
    if property_id.upper().startswith(MEASUREMENT_ID_PREFIX):
        raise ValueError(
            "GA_PROPERTY_ID には測定ID（G-...）ではなく、"
            "GA4の数値プロパティIDを設定してください。"
        )
    if not property_id.isdecimal():
        raise ValueError("GA_PROPERTY_ID は数字だけで指定してください。")
    return property_id


def exact_event_filter(event_name: str) -> FilterExpression:
    return FilterExpression(
        filter=Filter(
            field_name="eventName",
            string_filter=Filter.StringFilter(
                value=event_name,
                match_type=Filter.StringFilter.MatchType.EXACT,
                case_sensitive=True,
            ),
        )
    )


def event_list_filter(event_names: Sequence[str]) -> FilterExpression:
    return FilterExpression(
        filter=Filter(
            field_name="eventName",
            in_list_filter=Filter.InListFilter(
                values=list(event_names),
                case_sensitive=True,
            ),
        )
    )


def report_rows(response: object) -> list[list[str]]:
    rows: list[list[str]] = []
    for row in response.rows:
        rows.append(
            [value.value for value in row.dimension_values]
            + [value.value for value in row.metric_values]
        )
    return rows


def event_total(
    client: BetaAnalyticsDataClient, property_name: str, event_name: str
) -> int:
    response = client.run_report(
        RunReportRequest(
            property=property_name,
            metrics=[Metric(name="eventCount")],
            date_ranges=[REPORT_DATE_RANGE],
            dimension_filter=exact_event_filter(event_name),
        )
    )
    if not response.rows:
        return 0
    return int(response.rows[0].metric_values[0].value)


def print_table(title: str, headers: Sequence[str], rows: Iterable[Sequence[object]]) -> None:
    def display_width(value: str) -> int:
        return sum(
            2 if unicodedata.east_asian_width(character) in {"W", "F"} else 1
            for character in value
        )

    def pad(value: str, width: int) -> str:
        return value + " " * (width - display_width(value))

    normalized_rows = [[str(cell) for cell in row] for row in rows]
    widths = [display_width(header) for header in headers]
    for row in normalized_rows:
        for index, cell in enumerate(row):
            widths[index] = max(widths[index], display_width(cell))

    print(f"\n{title}")
    print("  ".join(pad(header, widths[index]) for index, header in enumerate(headers)))
    print("  ".join("-" * width for width in widths))
    if not normalized_rows:
        print("データなし")
        return
    for row in normalized_rows:
        print("  ".join(pad(cell, widths[index]) for index, cell in enumerate(row)))


def run_reports(client: BetaAnalyticsDataClient, property_id: str) -> None:
    property_name = f"properties/{property_id}"

    daily_response = client.run_report(
        RunReportRequest(
            property=property_name,
            dimensions=[Dimension(name="date")],
            metrics=[Metric(name="eventCount")],
            date_ranges=[REPORT_DATE_RANGE],
            dimension_filter=exact_event_filter("page_view"),
        )
    )
    daily_rows = report_rows(daily_response)
    for row in daily_rows:
        value = row[0]
        if len(value) == 8 and value.isdecimal():
            row[0] = f"{value[:4]}-{value[4:6]}-{value[6:]}"
    daily_rows.sort(key=lambda row: row[0])
    print_table(
        "1. 2026年6月以降の日別 page_view",
        ["日付", "page_view"],
        daily_rows,
    )

    page_response = client.run_report(
        RunReportRequest(
            property=property_name,
            dimensions=[Dimension(name="pagePath")],
            metrics=[Metric(name="eventCount")],
            date_ranges=[REPORT_DATE_RANGE],
            dimension_filter=exact_event_filter("page_view"),
            limit=1000,
        )
    )
    page_rows = report_rows(page_response)
    page_rows.sort(key=lambda row: (-int(row[1]), row[0]))
    print_table(
        "2. 2026年6月以降のページ別 page_view",
        ["ページ", "page_view"],
        page_rows,
    )

    event_response = client.run_report(
        RunReportRequest(
            property=property_name,
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount")],
            date_ranges=[REPORT_DATE_RANGE],
            limit=1000,
        )
    )
    event_rows = report_rows(event_response)
    event_rows.sort(key=lambda row: (-int(row[1]), row[0]))
    print_table(
        "3. 2026年6月以降のイベント名別イベント数",
        ["イベント名", "イベント数"],
        event_rows,
    )

    print_table(
        "4. 2026年6月以降のCTAイベント",
        ["イベント名", "イベント数"],
        [["cta_click", event_total(client, property_name, "cta_click")]],
    )
    print_table(
        "5. 2026年6月以降の外部リンクイベント",
        ["イベント名", "イベント数"],
        [["outbound_click", event_total(client, property_name, "outbound_click")]],
    )

    scroll_response = client.run_report(
        RunReportRequest(
            property=property_name,
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount")],
            date_ranges=[REPORT_DATE_RANGE],
            dimension_filter=event_list_filter(["scroll", "scroll_depth"]),
        )
    )
    scroll_counts = {"scroll": 0, "scroll_depth": 0}
    for event_name, count in report_rows(scroll_response):
        scroll_counts[event_name] = int(count)
    scroll_rows = [[name, count] for name, count in scroll_counts.items()]
    scroll_rows.append(["合計", sum(scroll_counts.values())])
    print_table(
        "6. 2026年6月以降のスクロールイベント",
        ["イベント名", "イベント数"],
        scroll_rows,
    )

    realtime_response = client.run_realtime_report(
        RunRealtimeReportRequest(
            property=property_name,
            metrics=[Metric(name="activeUsers")],
        )
    )
    active_users = (
        realtime_response.rows[0].metric_values[0].value
        if realtime_response.rows
        else "0"
    )
    print_table(
        "7. リアルタイムのアクティブユーザー数",
        ["指標", "人数"],
        [["activeUsers", active_users]],
    )


def main() -> int:
    args = parse_args()
    try:
        credentials, project_id = load_readonly_credentials()
        if args.check_auth:
            print("Application Default Credentials: OK")
            print(f"認証方式: {type(credentials).__name__}")
            print(f"読み取り専用スコープ: {READONLY_SCOPE}")
            print(f"Quota project: {project_id or '未設定'}")
            return 0

        property_id = require_property_id()
        print(f"GA4プロパティ: properties/{property_id}")
        print(f"期間: {REPORT_START_DATE} から today（2026年6月以降）")
        client = BetaAnalyticsDataClient(credentials=credentials)
        run_reports(client, property_id)
        return 0
    except DefaultCredentialsError:
        print(
            "エラー: Application Default Credentialsが見つかりません。\n"
            "gcloud auth application-default login を実行してください。",
            file=sys.stderr,
        )
    except RefreshError as error:
        print(f"エラー: ADCを更新できませんでした: {error}", file=sys.stderr)
    except ValueError as error:
        print(f"エラー: {error}", file=sys.stderr)
    except PermissionDenied:
        print(
            "エラー: Data APIの読み取りが拒否されました。Google Analytics Data APIを"
            "有効化し、認証ユーザーに対象GA4プロパティの閲覧者権限を付与してください。",
            file=sys.stderr,
        )
    except GoogleAPICallError as error:
        print(f"エラー: Google Analytics Data APIの呼び出しに失敗しました: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
