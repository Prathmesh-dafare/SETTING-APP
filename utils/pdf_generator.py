from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import cm
from collections import defaultdict
import io

def generate_pdf(exam, rows):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                             topMargin=2*cm, bottomMargin=2*cm,
                             leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('title', fontSize=18, fontName='Helvetica-Bold',
                                  alignment=1, spaceAfter=6, textColor=colors.HexColor('#1a1a2e'))
    sub_style = ParagraphStyle('sub', fontSize=11, fontName='Helvetica',
                                alignment=1, spaceAfter=4, textColor=colors.HexColor('#444'))

    story.append(Paragraph("EXAM SEATING ARRANGEMENT", title_style))
    story.append(Paragraph(f"Exam: {exam['name']} | Subject: {exam['subject']}", sub_style))
    story.append(Paragraph(f"Date: {exam['exam_date']} | Time: {exam['start_time']}", sub_style))
    story.append(Spacer(1, 0.5*cm))

    rooms = defaultdict(list)
    for row in rows:
        rooms[row['room_number']].append(row)

    for room_num, seats in rooms.items():
        room_info = seats[0]
        story.append(Paragraph(
            f"Room {room_num} — Block {room_info['block']}, Floor {room_info['floor']}",
            ParagraphStyle('room_head', fontSize=13, fontName='Helvetica-Bold',
                           spaceAfter=4, textColor=colors.HexColor('#4a00e0'))
        ))

        table_data = [['Seat', 'Name', 'Roll No.', 'Department']]
        for s in seats:
            table_data.append([str(s['seat_number']), s['name'], s['roll_number'], s['department']])

        t = Table(table_data, colWidths=[2*cm, 6*cm, 4*cm, 5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4a00e0')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 10),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8f8ff'), colors.white]),
            ('FONTSIZE', (0,1), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#ddd')),
            ('ROWPADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.8*cm))

    story.append(Spacer(1, 1*cm))
    sig_style = ParagraphStyle('sig', fontSize=10, spaceAfter=4)
    story.append(Paragraph("Invigilator Signature: ____________________", sig_style))
    story.append(Paragraph("Room Supervisor: ____________________", sig_style))

    doc.build(story)
    buffer.seek(0)
    return buffer