import sqlite3

dbs = [
    'backend/attendance_system.db',
    'backend/attendance_CSE.db',
    'backend/attendance_ECE.db',
    'backend/attendance_EE.db',
    'backend/attendance_ME.db',
    'backend/attendance_ISE.db',
    'backend/attendance_AIML.db',
    'backend/attendance_CSE_AI.db',
    'backend/attendance_CSE_IOT_CS_BT.db',
    'backend/attendance_BME.db'
]

cols = [
    ('department', 'VARCHAR(128)'),
    ('semester', 'INTEGER DEFAULT 7'),
    ('room', 'VARCHAR(32) DEFAULT "LH-101"')
]

for db_path in dbs:
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(timetable_schedules)")
        existing = [r[1] for r in cur.fetchall()]
        if not existing:
            continue
        for c_name, c_type in cols:
            if c_name not in existing:
                cur.execute(f"ALTER TABLE timetable_schedules ADD COLUMN {c_name} {c_type}")
                print(f"Added {c_name} to {db_path}")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error on {db_path}: {e}")

print("All migrations finished successfully.")
