from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path("Data/progress_log.db")


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS progress_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                update_id TEXT NOT NULL,
                report_id TEXT NOT NULL,
                activity_id TEXT NOT NULL,
                discipline TEXT,
                prev_status TEXT,
                new_status TEXT,
                prev_progress REAL,
                new_progress REAL,
                decision_reasons TEXT,
                message TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def log_update(
    update_id: str,
    report_id: str,
    activity_id: str,
    discipline: str | None,
    prev_status: str | None,
    new_status: str | None,
    prev_progress: float | None,
    new_progress: float | None,
    decision_reasons: list[str] | None,
    message: str,
    created_at: str,
) -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO progress_log
            (update_id, report_id, activity_id, discipline, prev_status, new_status,
             prev_progress, new_progress, decision_reasons, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                update_id,
                report_id,
                activity_id,
                discipline,
                prev_status,
                new_status,
                prev_progress,
                new_progress,
                json.dumps(decision_reasons or []),
                message,
                created_at,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def _rows_as_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


def query_activity_trace(activity_id: str) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM progress_log WHERE activity_id = ? ORDER BY created_at",
            (activity_id,),
        ).fetchall()
        return _rows_as_dicts(rows)
    finally:
        conn.close()


def query_by_discipline_status(discipline: str, status: str) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT * FROM progress_log
            WHERE discipline = ? AND new_status = ?
            ORDER BY created_at DESC
            """,
            (discipline, status),
        ).fetchall()
        return _rows_as_dicts(rows)
    finally:
        conn.close()


def query_avg_progress_by_discipline() -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT discipline, COUNT(*) AS update_count, AVG(new_progress) AS avg_progress
            FROM progress_log
            GROUP BY discipline
            ORDER BY discipline
            """
        ).fetchall()
        return _rows_as_dicts(rows)
    finally:
        conn.close()


def query_recent_updates(limit: int = 20) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM progress_log ORDER BY created_at DESC LIMIT ?",
            (max(1, min(limit, 100)),),
        ).fetchall()
        return _rows_as_dicts(rows)
    finally:
        conn.close()
