import os
import sqlite3
from typing import Optional
from contextlib import contextmanager

DATABASE_PATH = os.getenv("DATABASE_PATH", "actioned.db")

def get_db_connection() -> sqlite3.Connection:
    """
    Returns an optimized SQLite connection with foreign keys enabled,
    WAL mode, and row factory configured.
    """
    conn = sqlite3.connect(DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn

@contextmanager
def get_db():
    """
    Context manager for safe database transactions.
    Automatically commits on success and rolls back on exception.
    """
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """
    Initializes all SQLite tables and performance indexes.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # meetings table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            transcript_raw TEXT NOT NULL,
            format TEXT NOT NULL DEFAULT 'txt',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # decisions table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id TEXT PRIMARY KEY,
            meeting_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            owner TEXT,
            date TEXT,
            status TEXT NOT NULL DEFAULT 'active', -- active | superseded | conflicted
            source_line INTEGER,
            chroma_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE
        )
        """)

        # action_items table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id TEXT PRIMARY KEY,
            meeting_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            owner TEXT,
            deadline TEXT,
            confidence REAL DEFAULT 1.0,
            source_line INTEGER,
            status TEXT NOT NULL DEFAULT 'proposed', -- proposed | approved | rejected | done
            tracker_task_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE
        )
        """)

        # conflicts table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS conflicts (
            id TEXT PRIMARY KEY,
            meeting_id INTEGER NOT NULL,
            new_decision_id TEXT NOT NULL,
            old_decision_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open', -- open | confirmed | dismissed
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE
        )
        """)

        # Performance indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_decisions_owner ON decisions(owner)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_action_items_owner_status ON action_items(owner, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_action_items_deadline ON action_items(deadline)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_action_items_meeting ON action_items(meeting_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_meeting_id ON conflicts(meeting_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status)")

if __name__ == "__main__":
    init_db()
    print("Database schema and performance indexes initialized successfully.")
