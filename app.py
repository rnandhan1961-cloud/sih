from flask import Flask, jsonify, request, render_template, session, redirect, url_for
from flask_cors import CORS
import sqlite3
import hashlib
import secrets
import datetime
import json
import os

app = Flask(__name__)
app.secret_key = 'shiksha-leap-secret-key-2024'
CORS(app)

def get_db_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect('shiksha_leap.db')
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_otp():
    """Generate 6-digit OTP"""
    return str(secrets.randbelow(900000) + 100000)

def send_otp(contact, otp):
    """Mock OTP sending - in production, integrate with SMS/Email service"""
    print(f"OTP for {contact}: {otp}")
    return True

# ==================== MAIN ROUTES ====================

@app.route('/')
def index():
    """Main landing page"""
    return render_template('index.html')

@app.route('/home')
def home():
    """Home page after login - choose student/teacher"""
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('home.html')

@app.route('/registration')
def registration():
    """Registration form page"""
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('registration.html')

@app.route('/student/dashboard')
def student_dashboard():
    """Student dashboard - grade selection"""
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('index'))
    
    conn = get_db_connection()
    student = conn.execute('''
        SELECT s.*, u.email FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.user_id = ?
    ''', (session['user_id'],)).fetchone()
    conn.close()
    
    return render_template('student_dashboard.html', student=student)

@app.route('/student/grade/<int:grade>')
def grade_view(grade):
    """Grade-specific learning page"""
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('index'))
    
    return render_template('grade_view.html', grade=grade)

@app.route('/game/<path:game_path>')
def game_player(game_path):
    """Generic game player"""
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('index'))
    
    return render_template('game_player.html', game_path=game_path)

@app.route('/quiz/<path:quiz_path>')
def quiz_player(quiz_path):
    """Quiz player"""
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('index'))
    
    return render_template('quiz_player.html', quiz_path=quiz_path)

@app.route('/student/profile')
def student_profile():
    """Student profile with achievements"""
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('index'))
    
    conn = get_db_connection()
    student = conn.execute('''
        SELECT s.*, u.email FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.user_id = ?
    ''', (session['user_id'],)).fetchone()
    
    achievements = conn.execute('''
        SELECT * FROM achievements WHERE student_id = ? ORDER BY awarded_at DESC
    ''', (student['id'],)).fetchall()
    
    conn.close()
    
    return render_template('profile.html', student=student, achievements=achievements)

@app.route('/teacher/dashboard')
def teacher_dashboard():
    """Teacher dashboard"""
    if 'user_id' not in session or session.get('role') != 'teacher':
        return redirect(url_for('index'))
    
    conn = get_db_connection()
    teacher = conn.execute('''
        SELECT t.*, u.email FROM teachers t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.user_id = ?
    ''', (session['user_id'],)).fetchone()
    conn.close()
    
    return render_template('teacher_dashboard.html', teacher=teacher)

# ==================== API ROUTES ====================

@app.route('/api/send-otp', methods=['POST'])
def send_otp_api():
    """Send OTP to mobile/email"""
    data = request.get_json()
    contact = data.get('contact', '').strip()
    
    if not contact:
        return jsonify({'error': 'Contact is required'}), 400
    
    # Generate OTP
    otp = generate_otp()
    otp_hash = hash_password(otp)
    expires_at = datetime.datetime.now() + datetime.timedelta(minutes=10)
    
    # Store OTP in database
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO otp_verifications (contact, otp_code, otp_hash, expires_at)
        VALUES (?, ?, ?, ?)
    ''', (contact, otp, otp_hash, expires_at))
    conn.commit()
    conn.close()
    
    # Send OTP (mock implementation)
    if send_otp(contact, otp):
        return jsonify({'message': 'OTP sent successfully'})
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp_api():
    """Verify OTP and login/register user"""
    data = request.get_json()
    contact = data.get('contact', '').strip()
    otp = data.get('otp', '').strip()
    
    if not contact or not otp:
        return jsonify({'error': 'Contact and OTP are required'}), 400
    
    conn = get_db_connection()
    
    # Verify OTP
    otp_record = conn.execute('''
        SELECT * FROM otp_verifications 
        WHERE contact = ? AND otp_code = ? AND expires_at > ? AND verified = 0
        ORDER BY created_at DESC LIMIT 1
    ''', (contact, otp, datetime.datetime.now())).fetchone()
    
    if not otp_record:
        conn.close()
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    
    # Mark OTP as verified
    conn.execute('UPDATE otp_verifications SET verified = 1 WHERE id = ?', (otp_record['id'],))
    
    # Check if user exists
    user = conn.execute('SELECT * FROM users WHERE email = ? OR mobile = ?', (contact, contact)).fetchone()
    
    if user:
        # Existing user - login
        session['user_id'] = user['id']
        session['role'] = user['role']
        conn.commit()
        conn.close()
        
        if user['role'] == 'student':
            return jsonify({'redirect': '/student/dashboard', 'new_user': False})
        else:
            return jsonify({'redirect': '/teacher/dashboard', 'new_user': False})
    else:
        # New user - create account and redirect to registration
        if '@' in contact:
            email, mobile = contact, None
        else:
            email, mobile = None, contact
            
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (email, mobile, role) VALUES (?, ?, ?)
        ''', (email, mobile, 'student'))  # Default to student
        
        user_id = cursor.lastrowid
        session['user_id'] = user_id
        session['role'] = 'student'
        session['needs_registration'] = True
        
        conn.commit()
        conn.close()
        
        return jsonify({'redirect': '/registration', 'new_user': True})

@app.route('/api/school-info/<udise_code>')
def get_school_info(udise_code):
    """Get school information by UDISE code"""
    conn = get_db_connection()
    school = conn.execute('''
        SELECT * FROM udise_schools WHERE udise_code = ?
    ''', (udise_code,)).fetchone()
    conn.close()
    
    if school:
        return jsonify(dict(school))
    else:
        return jsonify({'error': 'UDISE code not found'}), 404

@app.route('/api/school-search')
def search_schools():
    """Search schools by name or UDISE code"""
    query = request.args.get('q', '').strip()
    
    if len(query) < 3:
        return jsonify([])
    
    conn = get_db_connection()
    schools = conn.execute('''
        SELECT * FROM udise_schools 
        WHERE udise_code LIKE ? OR school_name LIKE ? OR district LIKE ?
        LIMIT 20
    ''', (f'%{query}%', f'%{query}%', f'%{query}%')).fetchall()
    conn.close()
    
    return jsonify([dict(school) for school in schools])

@app.route('/api/register-student', methods=['POST'])
def register_student():
    """Complete student registration"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO students 
        (user_id, first_name, last_name, dob, grade, school_name, district, state, udise_code, medium)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        session['user_id'],
        data['first_name'],
        data['last_name'],
        data['dob'],
        int(data['grade']),
        data['school_name'],
        data['district'],
        data['state'],
        data['udise_code'],
        data['medium']
    ))
    
    # Update user role if needed
    conn.execute('UPDATE users SET role = ? WHERE id = ?', ('student', session['user_id']))
    
    conn.commit()
    conn.close()
    
    session['role'] = 'student'
    session.pop('needs_registration', None)
    
    return jsonify({'message': 'Registration successful', 'redirect': '/student/dashboard'})

@app.route('/api/register-teacher', methods=['POST'])
def register_teacher():
    """Complete teacher registration"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO teachers 
        (user_id, first_name, last_name, dob, qualification, school_name, district, state, udise_code, medium)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        session['user_id'],
        data['first_name'],
        data['last_name'],
        data['dob'],
        data['qualification'],
        data['school_name'],
        data['district'],
        data['state'],
        data['udise_code'],
        data['medium']
    ))
    
    # Update user role
    conn.execute('UPDATE users SET role = ? WHERE id = ?', ('teacher', session['user_id']))
    
    conn.commit()
    conn.close()
    
    session['role'] = 'teacher'
    session.pop('needs_registration', None)
    
    return jsonify({'message': 'Registration successful', 'redirect': '/teacher/dashboard'})

@app.route('/api/teacher/dashboard-data')
def teacher_dashboard_data():
    """Get teacher dashboard data"""
    if 'user_id' not in session or session.get('role') != 'teacher':
        return jsonify({'error': 'Not authorized'}), 403
    
    # Get filters
    grade_filter = request.args.get('grade')
    school_filter = request.args.get('school')
    district_filter = request.args.get('district')
    
    conn = get_db_connection()
    
    # Get teacher info
    teacher = conn.execute('''
        SELECT * FROM teachers WHERE user_id = ?
    ''', (session['user_id'],)).fetchone()
    
    # Build query for students in same school/district
    query = '''
        SELECT s.id, s.first_name, s.last_name, s.grade, s.school_name, s.district,
               COUNT(gl.id) as total_games,
               AVG(gl.score * 100.0 / gl.max_score) as avg_score,
               MAX(gl.played_at) as last_activity
        FROM students s
        LEFT JOIN game_logs gl ON s.id = gl.student_id
        WHERE s.udise_code = ?
    '''
    params = [teacher['udise_code']]
    
    if grade_filter:
        query += ' AND s.grade = ?'
        params.append(grade_filter)
    
    query += ' GROUP BY s.id ORDER BY s.grade, s.first_name'
    
    students = conn.execute(query, params).fetchall()
    
    # Get subject-wise performance
    subject_performance = conn.execute('''
        SELECT gl.subject, AVG(gl.score * 100.0 / gl.max_score) as avg_score, COUNT(*) as total_attempts
        FROM game_logs gl
        JOIN students s ON gl.student_id = s.id
        WHERE s.udise_code = ?
        GROUP BY gl.subject
    ''', (teacher['udise_code'],)).fetchall()
    
    conn.close()
    
    return jsonify({
        'students': [dict(student) for student in students],
        'subject_performance': [dict(perf) for perf in subject_performance],
        'teacher': dict(teacher)
    })

@app.route('/api/game-log', methods=['POST'])
def log_game_performance():
    """Log student game/quiz performance"""
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.get_json()
    
    conn = get_db_connection()
    
    # Get student ID
    student = conn.execute('SELECT id FROM students WHERE user_id = ?', (session['user_id'],)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    # Log the performance
    conn.execute('''
        INSERT INTO game_logs 
        (student_id, subject, grade, game_id, game_type, level, score, max_score, time_spent, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ''', (
        student['id'],
        data['subject'],
        data['grade'],
        data['game_id'],
        data.get('game_type', 'game'),
        data.get('level', 'medium'),
        data['score'],
        data['max_score'],
        data.get('time_spent', 0)
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Performance logged successfully'})

@app.route('/api/sync-offline-data', methods=['POST'])
def sync_offline_data():
    """Sync offline game logs"""
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.get_json()
    logs = data.get('logs', [])
    
    conn = get_db_connection()
    student = conn.execute('SELECT id FROM students WHERE user_id = ?', (session['user_id'],)).fetchone()
    
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    synced_count = 0
    for log in logs:
        try:
            conn.execute('''
                INSERT INTO game_logs 
                (student_id, subject, grade, game_id, game_type, level, score, max_score, time_spent, played_at, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ''', (
                student['id'],
                log['subject'],
                log['grade'],
                log['game_id'],
                log.get('game_type', 'game'),
                log.get('level', 'medium'),
                log['score'],
                log['max_score'],
                log.get('time_spent', 0),
                log.get('played_at', datetime.datetime.now())
            ))
            synced_count += 1
        except Exception as e:
            print(f"Error syncing log: {e}")
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': f'Synced {synced_count} logs successfully'})

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Initialize database if it doesn't exist
    if not os.path.exists('shiksha_leap.db'):
        from database import init_db, import_udise_data
        init_db()
        import_udise_data()
    
    app.run(debug=True, host='0.0.0.0', port=5000)