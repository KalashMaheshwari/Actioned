import os
import sqlite3
from typing import Optional

DATABASE_PATH = os.getenv("DATABASE_PATH", "actioned.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # meetings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        transcript_raw TEXT NOT NULL,
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
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
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
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
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
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
