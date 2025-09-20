import sqlite3
import csv
import os

def init_db():
    """Initialize the SQLite database with all required tables"""
    conn = sqlite3.connect('shiksha_leap.db')
    cursor = conn.cursor()

    # User table for both students and teachers
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        mobile TEXT UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    )''')

    # Student-specific information
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY,
        user_id INTEGER UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        grade INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 12),
        school_name TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        udise_code TEXT NOT NULL,
        medium TEXT NOT NULL CHECK (medium IN ('English', 'Hindi', 'Tamil', 'Odia')),
        board TEXT DEFAULT 'SCERT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    # Teacher-specific information
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY,
        user_id INTEGER UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        qualification TEXT NOT NULL,
        school_name TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        udise_code TEXT NOT NULL,
        medium TEXT NOT NULL CHECK (medium IN ('English', 'Hindi', 'Tamil', 'Odia')),
        subjects_taught TEXT,
        grades_taught TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')

    # UDISE school data
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS udise_schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        udise_code TEXT UNIQUE NOT NULL,
        school_name TEXT NOT NULL,
        district TEXT NOT NULL,
        block TEXT NOT NULL,
        category TEXT,
        area TEXT,
        management TEXT
    )''')

    # Game/Quiz performance logs - core analytics table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS game_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        grade INTEGER NOT NULL,
        game_id TEXT NOT NULL,
        game_type TEXT NOT NULL CHECK (game_type IN ('game', 'quiz')),
        level TEXT NOT NULL CHECK (level IN ('easy', 'medium', 'hard')),
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        time_spent INTEGER,
        attempts INTEGER DEFAULT 1,
        completed INTEGER DEFAULT 1,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (student_id) REFERENCES students (id)
    )''')
    
    # Student achievements/badges
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        badge_name TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        description TEXT,
        icon_path TEXT,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id)
    )''')

    # OTP verification table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Student progress tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS student_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        grade INTEGER NOT NULL,
        topic TEXT NOT NULL,
        mastery_level REAL DEFAULT 0.0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_time_spent INTEGER DEFAULT 0,
        FOREIGN KEY (student_id) REFERENCES students (id),
        UNIQUE(student_id, subject, grade, topic)
    )''')

    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def import_udise_data():
    """Import UDISE school data from CSV file"""
    if not os.path.exists('a.csv'):
        print("Warning: a.csv file not found. UDISE data not imported.")
        return
    
    conn = sqlite3.connect('shiksha_leap.db')
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute('DELETE FROM udise_schools')
    
    with open('a.csv', 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            cursor.execute('''
                INSERT INTO udise_schools 
                (udise_code, school_name, district, block, category, area, management)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                row['UDISE_Code'],
                row['School_Name'],
                row['District'],
                row['Block'],
                row.get('Category', ''),
                row.get('Area', ''),
                row.get('Management', '')
            ))
    
    conn.commit()
    count = cursor.execute('SELECT COUNT(*) FROM udise_schools').fetchone()[0]
    conn.close()
    print(f"Imported {count} UDISE school records successfully!")

if __name__ == '__main__':
    init_db()
    import_udise_data()