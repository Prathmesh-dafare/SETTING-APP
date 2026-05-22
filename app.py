from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from functools import wraps
import mysql.connector
import json
import random
import io
from datetime import datetime
from utils.seating_algorithm import generate_seating
from utils.pdf_generator import generate_pdf

app = Flask(__name__)
app.secret_key = "supersecretkey"

app.config['SESSION_PERMANENT'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.secret_key = 'exam_seating_secret_2024'

DB_CONFIG = {
    'host': 'kodama.proxy.rlwy.net',
    'user': 'root',
    'password': 'oIhaDisJlGDttfyDDBooNIOLLYZYYECd',
    'database': 'railway',
    'port': 12086

}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

import os

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
# ─── AUTH ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json

        print("LOGIN REQUEST:", data)

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM admins WHERE username=%s AND password=MD5(%s)",
            (data['username'], data['password'])
        )

        admin = cursor.fetchone()

        print("ADMIN FOUND:", admin)

        db.close()

        if admin:
            session['admin_id'] = admin['id']
            session['admin_name'] = admin['name']

            print("SESSION CREATED")
            print(session)

            return jsonify({
                'success': True,
                'name': admin['name']
            })

        return jsonify({
            'success': False,
            'error': 'Invalid credentials'
        }), 401

    except Exception as e:
        print("LOGIN ERROR:", e)

        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()

    return jsonify({
        'success': True
    })


@app.route('/api/me')
def me():

    print("CURRENT SESSION:", session)

    if 'admin_id' in session:
        return jsonify({
            'logged_in': True,
            'name': session.get('admin_name')
        })

    return jsonify({
        'logged_in': False
    })

# ─── DASHBOARD ──────────────────────────────────────────────────────────────

@app.route('/api/dashboard')
@login_required
def dashboard():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM students")
    students = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM rooms")
    rooms = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM exams")
    exams = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM seating_arrangements")
    arrangements = cursor.fetchone()['count']
    cursor.execute("SELECT SUM(capacity) as total FROM rooms")
    total_capacity = cursor.fetchone()['total'] or 0
    cursor.execute("SELECT COUNT(*) as assigned FROM seating_arrangements WHERE exam_id = (SELECT id FROM exams ORDER BY created_at DESC LIMIT 1)")
    assigned = cursor.fetchone()['assigned']
    cursor.execute("SELECT department, COUNT(*) as count FROM students GROUP BY department")
    dept_data = cursor.fetchall()
    db.close()
    return jsonify({
        'students': students, 'rooms': rooms, 'exams': exams,
        'arrangements': arrangements, 'total_capacity': total_capacity,
        'empty_seats': max(0, total_capacity - assigned),
        'dept_data': dept_data
    })

# ─── STUDENTS ───────────────────────────────────────────────────────────────

@app.route('/api/students', methods=['GET'])
@login_required
def get_students():
    try:
        search = request.args.get('search', '')
        dept = request.args.get('dept', '')

        db = get_db()
        cursor = db.cursor(dictionary=True)

        q = "SELECT * FROM students WHERE 1=1"
        params = []

        if search:
            q += " AND (name LIKE %s OR roll_number LIKE %s)"
            params += [f'%{search}%', f'%{search}%']

        if dept:
            q += " AND department=%s"
            params.append(dept)

        q += " ORDER BY id DESC"

        cursor.execute(q, params)
        students = cursor.fetchall()

        db.close()

        return jsonify(students)

    except Exception as e:
        print("GET STUDENTS ERROR:", e)
        return jsonify([])


@app.route('/api/students', methods=['POST'])
@login_required
def add_student():
    try:
        data = request.json

        print("Received Data:", data)

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO students
            (name, roll_number, department, year, subject)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                data.get('name'),
                data.get('roll_number'),
                data.get('department'),
                data.get('year'),
                data.get('subject')
            )
        )

        db.commit()

        print("Student inserted successfully!")

        new_id = cursor.lastrowid

        db.close()

        return jsonify({
            'success': True,
            'id': new_id
        })

    except Exception as e:
        print("ADD STUDENT ERROR:", e)

        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/students/<int:id>', methods=['PUT'])
@login_required
def update_student(id):
    try:
        data = request.json

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            """
            UPDATE students
            SET
                name=%s,
                roll_number=%s,
                department=%s,
                year=%s,
                subject=%s
            WHERE id=%s
            """,
            (
                data.get('name'),
                data.get('roll_number'),
                data.get('department'),
                data.get('year'),
                data.get('subject'),
                id
            )
        )

        db.commit()
        db.close()

        return jsonify({'success': True})

    except Exception as e:
        print("UPDATE STUDENT ERROR:", e)

        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/students/<int:id>', methods=['DELETE'])
@login_required
def delete_student(id):
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "DELETE FROM students WHERE id=%s",
            (id,)
        )

        db.commit()
        db.close()

        return jsonify({'success': True})

    except Exception as e:
        print("DELETE STUDENT ERROR:", e)

        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ─── ROOMS ──────────────────────────────────────────────────────────────────

@app.route('/api/rooms', methods=['GET'])
@login_required
def get_rooms():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM rooms ORDER BY block, floor, room_number")
    rooms = cursor.fetchall()
    db.close()
    return jsonify(rooms)

@app.route('/api/rooms', methods=['POST'])
@login_required
def add_room():
    data = request.json
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO rooms (room_number, capacity, floor, block) VALUES (%s,%s,%s,%s)",
        (data['room_number'], data['capacity'], data['floor'], data['block'])
    )
    db.commit()
    new_id = cursor.lastrowid
    db.close()
    return jsonify({'success': True, 'id': new_id})

@app.route('/api/rooms/<int:id>', methods=['PUT'])
@login_required
def update_room(id):
    data = request.json
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE rooms SET room_number=%s, capacity=%s, floor=%s, block=%s WHERE id=%s",
        (data['room_number'], data['capacity'], data['floor'], data['block'], id)
    )
    db.commit()
    db.close()
    return jsonify({'success': True})

@app.route('/api/rooms/<int:id>', methods=['DELETE'])
@login_required
def delete_room(id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM rooms WHERE id=%s", (id,))
    db.commit()
    db.close()
    return jsonify({'success': True})

# ─── EXAMS ──────────────────────────────────────────────────────────────────

@app.route('/api/exams', methods=['GET'])
@login_required
def get_exams():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM exams ORDER BY exam_date DESC")
    exams = cursor.fetchall()
    db.close()
    return jsonify(exams)

@app.route('/api/exams', methods=['POST'])
@login_required
def add_exam():
    data = request.json
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO exams (name, subject, exam_date, start_time) VALUES (%s,%s,%s,%s)",
        (data['name'], data['subject'], data['exam_date'], data['start_time'])
    )
    db.commit()
    new_id = cursor.lastrowid
    db.close()
    return jsonify({'success': True, 'id': new_id})

# ─── SEATING ────────────────────────────────────────────────────────────────

@app.route('/api/seating/generate', methods=['POST'])
@login_required
def generate_seating_route():
    data = request.json
    exam_id = data['exam_id']
    room_ids = data['room_ids']
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM students ORDER BY department, roll_number")
    students = cursor.fetchall()
    cursor.execute(f"SELECT * FROM rooms WHERE id IN ({','.join(['%s']*len(room_ids))})", room_ids)
    rooms = cursor.fetchall()
    arrangement = generate_seating(students, rooms)
    cursor.execute("DELETE FROM seating_arrangements WHERE exam_id=%s", (exam_id,))
    for item in arrangement:
        cursor.execute(
            "INSERT INTO seating_arrangements (exam_id, student_id, room_id, seat_number) VALUES (%s,%s,%s,%s)",
            (exam_id, item['student_id'], item['room_id'], item['seat_number'])
        )
    db.commit()
    db.close()
    return jsonify({'success': True, 'arrangement': arrangement})

@app.route('/api/seating/<int:exam_id>')
@login_required
def get_seating(exam_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT sa.seat_number, s.name, s.roll_number, s.department, r.room_number, r.block, r.floor
        FROM seating_arrangements sa
        JOIN students s ON sa.student_id = s.id
        JOIN rooms r ON sa.room_id = r.id
        WHERE sa.exam_id = %s
        ORDER BY r.room_number, sa.seat_number
    """, (exam_id,))
    rows = cursor.fetchall()
    db.close()
    return jsonify(rows)

@app.route('/api/seating/<int:exam_id>/pdf')
@login_required
def download_pdf(exam_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM exams WHERE id=%s", (exam_id,))
    exam = cursor.fetchone()
    cursor.execute("""
        SELECT sa.seat_number, s.name, s.roll_number, s.department, r.room_number, r.block, r.floor
        FROM seating_arrangements sa
        JOIN students s ON sa.student_id = s.id
        JOIN rooms r ON sa.room_id = r.id
        WHERE sa.exam_id = %s
        ORDER BY r.room_number, sa.seat_number
    """, (exam_id,))
    rows = cursor.fetchall()
    db.close()
    pdf_buffer = generate_pdf(exam, rows)
    return send_file(pdf_buffer, mimetype='application/pdf',
                     download_name=f'seating_{exam["name"]}.pdf', as_attachment=True)

# ─── ANALYTICS ──────────────────────────────────────────────────────────────

@app.route('/api/analytics')
@login_required
def analytics():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT department, COUNT(*) as count FROM students GROUP BY department")
    dept_dist = cursor.fetchall()
    cursor.execute("""
        SELECT r.room_number, r.capacity,
               COUNT(sa.id) as used
        FROM rooms r
        LEFT JOIN seating_arrangements sa ON r.id = sa.room_id
        GROUP BY r.id
    """)
    room_util = cursor.fetchall()
    cursor.execute("SELECT year, COUNT(*) as count FROM students GROUP BY year")
    year_dist = cursor.fetchall()
    db.close()
    return jsonify({'dept_dist': dept_dist, 'room_util': room_util, 'year_dist': year_dist})

if __name__ == '__main__':
    app.run(debug=True)