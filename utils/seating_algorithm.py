import random
from collections import defaultdict

def generate_seating(students, rooms):
    """
    Smart seating: alternate departments so no two adjacent
    students are from the same department.
    """
    dept_groups = defaultdict(list)
    for s in students:
        dept_groups[s['department']].append(s)

    for dept in dept_groups:
        random.shuffle(dept_groups[dept])

    depts = list(dept_groups.keys())
    random.shuffle(depts)

    interleaved = []
    while any(dept_groups[d] for d in depts):
        for d in depts:
            if dept_groups[d]:
                interleaved.append(dept_groups[d].pop(0))

    arrangement = []
    seat_counter = 1
    student_idx = 0

    for room in rooms:
        capacity = room['capacity']
        for seat in range(1, capacity + 1):
            if student_idx >= len(interleaved):
                break
            student = interleaved[student_idx]
            arrangement.append({
                'student_id': student['id'],
                'student_name': student['name'],
                'roll_number': student['roll_number'],
                'department': student['department'],
                'room_id': room['id'],
                'room_number': room['room_number'],
                'seat_number': seat,
                'block': room['block'],
                'floor': room['floor']
            })
            student_idx += 1

    return arrangement