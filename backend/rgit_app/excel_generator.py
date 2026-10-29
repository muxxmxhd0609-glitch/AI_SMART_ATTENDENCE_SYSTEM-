"""
RGIT Bangalore - Excel & CSV Attendance Sheet Generator
Generates pixel-perfect, beautifully styled attendance sheets matching the official RGIT format:
- Banner: RAJIV GANDHI INSTITUTE OF TECHNOLOGY, BANGALORE
- AI SMART ATTENDANCE SYSTEM USING FACE RECOGNITION
- Metadata Card (Class, Section, Subject, Date, Month, Faculty, Legend P/A/L/H)
- 31-Day Matrix with day numbers and weekday names
- P (Green), A (Red), L (Yellow), H (Holiday/Sunday - Blue)
- Student Attendance Summary (Present, Absent, Leave, Total, Attendance %)
- Class Summary Card, Attendance Summary Card, Percentage Breakdown
- Remarks and Official Signatures (Faculty & HOD)
"""

import io
import csv
import calendar
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Theme Colors (Matching the official RGIT sheet image)
COLOR_NAVY = "002D62"       # Dark Navy Header Fill & Titles
COLOR_DARK_BLUE = "0D2B52"  # Subtitles
COLOR_WHITE = "FFFFFF"      # Header Text
COLOR_LIGHT_BG = "F8FAFC"   # Background card
COLOR_BORDER = "CBD5E1"     # Grid border

# Status Badges
COLOR_PRESENT_FILL = "D4EDDA"   # Light Green
COLOR_PRESENT_FONT = "155724"   # Dark Green
COLOR_ABSENT_FILL  = "F8D7DA"   # Light Red
COLOR_ABSENT_FONT  = "721C24"   # Dark Red
COLOR_LEAVE_FILL   = "FFF3CD"   # Light Yellow
COLOR_LEAVE_FONT   = "856404"   # Dark Yellow/Brown
COLOR_HOLIDAY_FILL = "CCE5FF"   # Light Blue (Holiday/Sunday)
COLOR_HOLIDAY_FONT = "004085"   # Dark Blue

# Legend Badges (Solid vivid)
LEGEND_P_FILL = "70D48A"
LEGEND_P_FONT = "14532D"
LEGEND_A_FILL = "F87171"
LEGEND_A_FONT = "7F1D1D"
LEGEND_L_FILL = "FACC15"
LEGEND_L_FONT = "713F12"
LEGEND_H_FILL = "67E8F9"
LEGEND_H_FONT = "0C4A6E"


def get_weekday_abbr(year: int, month: int, day: int) -> str:
    """Returns Mon, Tue, Wed, Thu, Fri, Sat, Sun"""
    dt = date(year, month, day)
    return dt.strftime("%a")


def create_attendance_workbook(
    department_name: str,
    subject_code: str,
    subject_name: str,
    semester: int,
    section: str,
    faculty_name: str,
    year: int,
    month: int,
    students_data: List[Dict[str, Any]],
    generated_date: Optional[date] = None,
    holidays_map: Optional[Dict[int, str]] = None
) -> Workbook:
    """
    Builds an openpyxl Workbook styled identically to the official RGIT Excel attendance sheet.
    Adheres to Google Calendar Government Holidays and computes report data till date.
    """
    if generated_date is None:
        generated_date = date.today()
    if holidays_map is None:
        holidays_map = {}

    wb = Workbook()
    ws = wb.active
    ws.title = f"Attendance_Sem{semester}_{section}"
    ws.views.sheetView[0].showGridLines = True

    # Font definitions
    font_name = "Segoe UI"
    thin_border = Border(
        left=Side(style='thin', color=COLOR_BORDER),
        right=Side(style='thin', color=COLOR_BORDER),
        top=Side(style='thin', color=COLOR_BORDER),
        bottom=Side(style='thin', color=COLOR_BORDER)
    )
    navy_border = Border(
        left=Side(style='medium', color=COLOR_NAVY),
        right=Side(style='medium', color=COLOR_NAVY),
        top=Side(style='medium', color=COLOR_NAVY),
        bottom=Side(style='medium', color=COLOR_NAVY)
    )

    days_in_month = calendar.monthrange(year, month)[1]
    month_name = calendar.month_name[month]

    # Column Mapping:
    # A: S. No. (Col 1)
    # B: USN (Col 2)
    # C: Student Name (Col 3)
    # D .. AH: Days 1 to 31 (Cols 4 to 34)
    # AI: Present (Col 35)
    # AJ: Absent (Col 36)
    # AK: Leave (Col 37)
    # AL: Total (Col 38)
    # AM: Attendance % (Col 39)
    total_cols = 39
    max_col_letter = get_column_letter(total_cols)

    # 1. Column Widths
    ws.column_dimensions['A'].width = 7
    ws.column_dimensions['B'].width = 16
    ws.column_dimensions['C'].width = 26
    for c in range(4, 35):
        ws.column_dimensions[get_column_letter(c)].width = 4.8
    ws.column_dimensions['AI'].width = 9
    ws.column_dimensions['AJ'].width = 9
    ws.column_dimensions['AK'].width = 9
    ws.column_dimensions['AL'].width = 9
    ws.column_dimensions['AM'].width = 15

    # 2. Main Title & Header Banner
    ws.merge_cells('A2:AM2')
    cell_a2 = ws['A2']
    cell_a2.value = "RAJIV GANDHI INSTITUTE OF TECHNOLOGY"
    cell_a2.font = Font(name=font_name, size=16, bold=True, color=COLOR_NAVY)
    cell_a2.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 24

    ws.merge_cells('A3:AM3')
    cell_a3 = ws['A3']
    cell_a3.value = "BANGALORE"
    cell_a3.font = Font(name=font_name, size=13, bold=True, color=COLOR_NAVY)
    cell_a3.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[3].height = 19

    ws.merge_cells('A4:AM4')
    cell_a4 = ws['A4']
    cell_a4.value = department_name.upper()
    cell_a4.font = Font(name=font_name, size=11, bold=True, color=COLOR_DARK_BLUE)
    cell_a4.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[4].height = 18

    # Dark Blue Center Pill Banner
    ws.merge_cells('H5:AF5')
    banner_cell = ws['H5']
    banner_cell.value = "AI SMART ATTENDANCE SYSTEM USING FACE RECOGNITION"
    banner_cell.font = Font(name=font_name, size=11, bold=True, color=COLOR_WHITE)
    banner_fill = PatternFill(start_color=COLOR_NAVY, end_color=COLOR_NAVY, fill_type="solid")
    banner_cell.alignment = Alignment(horizontal="center", vertical="center")
    for col in range(8, 33):
        cell = ws.cell(row=5, column=col)
        cell.fill = banner_fill
    ws.row_dimensions[5].height = 22

    ws.merge_cells('A6:AM6')
    cell_a6 = ws['A6']
    cell_a6.value = "—— STUDENT ATTENDANCE SHEET ——"
    cell_a6.font = Font(name=font_name, size=11, bold=True, color=COLOR_NAVY)
    cell_a6.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[6].height = 18

    # 3. Metadata & Legend Box (Rows 8 to 11)
    # Box Border for Metadata
    for r in range(8, 12):
        ws.row_dimensions[r].height = 17

    # Left Column
    ws['B8'] = "Class"
    ws['C8'] = f": {semester}th Semester"
    ws['B9'] = "Section"
    ws['C9'] = f": {section}"
    subj_label = f"{subject_code} - {subject_name}" if subject_name else subject_code
    ws['B10'] = "Subject"
    ws['C10'] = f": {subj_label}"

    # Middle Column
    ws['P8'] = "Date"
    ws['Q8'] = f": {generated_date.strftime('%d-%m-%Y')}"
    ws['P9'] = "Month"
    ws['Q9'] = f": {month_name} {year}"
    ws['P10'] = "Faculty"
    ws['Q10'] = f": {faculty_name}"

    # Row 11: Calendar source and report scope
    ws['B11'] = "Calendar"
    ws['C11'] = ": Google Calendar (Govt Holidays Synced)"
    ws['P11'] = "Report Term"
    ws['Q11'] = f": Till Date ({generated_date.strftime('%d-%m-%Y')})"

    for r in [8, 9, 10, 11]:
        ws[f'B{r}'].font = Font(name=font_name, size=9.5, bold=True, color=COLOR_NAVY)
        ws[f'C{r}'].font = Font(name=font_name, size=9.5, bold=False, color="1E293B")
        ws[f'P{r}'].font = Font(name=font_name, size=9.5, bold=True, color=COLOR_NAVY)
        ws[f'Q{r}'].font = Font(name=font_name, size=9.5, bold=False, color="1E293B")

    # Right Legend Badges (Cols AE to AL)
    legend_items = [
        (8, "P", "Present", LEGEND_P_FILL, LEGEND_P_FONT),
        (9, "A", "Absent",  LEGEND_A_FILL, LEGEND_A_FONT),
        (10, "L", "Leave",  LEGEND_L_FILL, LEGEND_L_FONT),
        (11, "H", "Holiday (Govt / Sun)", LEGEND_H_FILL, LEGEND_H_FONT),
    ]
    for row_idx, badge, label, bg, fg in legend_items:
        # Badge
        badge_cell = ws.cell(row=row_idx, column=35)
        badge_cell.value = badge
        badge_cell.font = Font(name=font_name, size=9, bold=True, color=fg)
        badge_cell.fill = PatternFill(start_color=bg, end_color=bg, fill_type="solid")
        badge_cell.alignment = Alignment(horizontal="center", vertical="center")
        badge_cell.border = thin_border

        # Label
        ws.merge_cells(start_row=row_idx, start_column=36, end_row=row_idx, end_column=39)
        lbl_cell = ws.cell(row=row_idx, column=36)
        lbl_cell.value = label
        lbl_cell.font = Font(name=font_name, size=9, bold=True, color="334155")
        lbl_cell.alignment = Alignment(horizontal="left", vertical="center")

    # Outer border for Metadata Box
    for c in range(1, total_cols + 1):
        ws.cell(row=7, column=c).border = Border(bottom=Side(style='thin', color="94A3B8"))
        ws.cell(row=12, column=c).border = Border(top=Side(style='thin', color="94A3B8"))

    # 4. Table Header (Rows 13 & 14)
    ws.row_dimensions[13].height = 20
    ws.row_dimensions[14].height = 18

    header_fill = PatternFill(start_color=COLOR_NAVY, end_color=COLOR_NAVY, fill_type="solid")
    header_font = Font(name=font_name, size=9, bold=True, color=COLOR_WHITE)
    weekday_font = Font(name=font_name, size=8, bold=True, color="E2E8F0")

    # Merged Fixed Headers (Rows 13-14)
    fixed_headers = [
        (1, "S. No."),
        (2, "USN"),
        (3, "Student Name"),
        (35, "Present"),
        (36, "Absent"),
        (37, "Leave"),
        (38, "Total"),
        (39, "Attendance %")
    ]
    for col_idx, text in fixed_headers:
        ws.merge_cells(start_row=13, start_column=col_idx, end_row=14, end_column=col_idx)
        c13 = ws.cell(row=13, column=col_idx)
        c13.value = text
        c13.font = header_font
        c13.fill = header_fill
        c13.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c13.border = thin_border

        c14 = ws.cell(row=14, column=col_idx)
        c14.fill = header_fill
        c14.border = thin_border

    # Days 1 to 31 Headers
    for day in range(1, 32):
        col_idx = 3 + day  # 1 -> Col 4 (D), 31 -> Col 34 (AH)
        c13 = ws.cell(row=13, column=col_idx)
        c13.value = day
        c13.font = header_font
        c13.fill = header_fill
        c13.alignment = Alignment(horizontal="center", vertical="center")
        c13.border = thin_border

        c14 = ws.cell(row=14, column=col_idx)
        if day <= days_in_month:
            weekday_str = get_weekday_abbr(year, month, day)
            c14.value = weekday_str
        else:
            c14.value = "-"
        c14.font = weekday_font
        c14.fill = header_fill
        c14.alignment = Alignment(horizontal="center", vertical="center")
        c14.border = thin_border

    # 5. Student Rows (Row 15 onwards)
    data_start_row = 15
    current_row = data_start_row

    total_class_present = 0
    total_class_absent = 0
    total_class_leave = 0

    for idx, s in enumerate(students_data, start=1):
        ws.row_dimensions[current_row].height = 19
        usn = s.get("usn", "")
        name = s.get("full_name", s.get("name", ""))
        daily_statuses = s.get("daily_statuses", {})  # day (1..31) -> 'P' / 'A' / 'L' / 'H'

        # S.No.
        c_sno = ws.cell(row=current_row, column=1, value=idx)
        c_sno.alignment = Alignment(horizontal="center", vertical="center")
        c_sno.font = Font(name=font_name, size=9)
        c_sno.border = thin_border

        # USN
        c_usn = ws.cell(row=current_row, column=2, value=usn)
        c_usn.alignment = Alignment(horizontal="center", vertical="center")
        c_usn.font = Font(name=font_name, size=9, bold=True, color="1E3A8A")
        c_usn.border = thin_border

        # Student Name
        c_name = ws.cell(row=current_row, column=3, value=name)
        c_name.alignment = Alignment(horizontal="left", vertical="center")
        c_name.font = Font(name=font_name, size=9)
        c_name.border = thin_border

        # 31 Days
        student_present = 0
        student_absent = 0
        student_leave = 0

        for day in range(1, 32):
            col_idx = 3 + day
            cell = ws.cell(row=current_row, column=col_idx)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="center", vertical="center")

            if day <= days_in_month:
                is_sun = (date(year, month, day).weekday() == 6)
                is_gov = (day in holidays_map)
                default_status = "H" if (is_sun or is_gov) else "P"
                status = daily_statuses.get(day, default_status)

                cell.value = status
                if status == "P":
                    student_present += 1
                    cell.fill = PatternFill(start_color=COLOR_PRESENT_FILL, end_color=COLOR_PRESENT_FILL, fill_type="solid")
                    cell.font = Font(name=font_name, size=8.5, bold=True, color=COLOR_PRESENT_FONT)
                elif status == "A":
                    student_absent += 1
                    cell.fill = PatternFill(start_color=COLOR_ABSENT_FILL, end_color=COLOR_ABSENT_FILL, fill_type="solid")
                    cell.font = Font(name=font_name, size=8.5, bold=True, color=COLOR_ABSENT_FONT)
                elif status == "L":
                    student_leave += 1
                    cell.fill = PatternFill(start_color=COLOR_LEAVE_FILL, end_color=COLOR_LEAVE_FILL, fill_type="solid")
                    cell.font = Font(name=font_name, size=8.5, bold=True, color=COLOR_LEAVE_FONT)
                elif status == "H":  # Holiday (Google Calendar Govt Holiday or Sunday)
                    cell.fill = PatternFill(start_color=COLOR_HOLIDAY_FILL, end_color=COLOR_HOLIDAY_FILL, fill_type="solid")
                    cell.font = Font(name=font_name, size=8.5, bold=True, color=COLOR_HOLIDAY_FONT)
                else:  # "-" (Future / Unconducted Days after Till Date)
                    cell.value = "-"
                    cell.font = Font(name=font_name, size=8.5, color="94A3B8")
            else:
                cell.value = "-"
                cell.font = Font(name=font_name, size=8.5, color="94A3B8")

        total_working = student_present + student_absent + student_leave
        if total_working == 0:
            total_working = 1
        att_pct = round((student_present / total_working) * 100.0, 2)

        total_class_present += student_present
        total_class_absent += student_absent
        total_class_leave += student_leave

        # Summary columns
        c_p = ws.cell(row=current_row, column=35, value=student_present)
        c_p.alignment = Alignment(horizontal="center", vertical="center")
        c_p.font = Font(name=font_name, size=9, bold=True, color=COLOR_PRESENT_FONT)
        c_p.border = thin_border

        c_a = ws.cell(row=current_row, column=36, value=student_absent)
        c_a.alignment = Alignment(horizontal="center", vertical="center")
        c_a.font = Font(name=font_name, size=9, bold=True, color=COLOR_ABSENT_FONT)
        c_a.border = thin_border

        c_l = ws.cell(row=current_row, column=37, value=student_leave)
        c_l.alignment = Alignment(horizontal="center", vertical="center")
        c_l.font = Font(name=font_name, size=9, bold=True, color=COLOR_LEAVE_FONT)
        c_l.border = thin_border

        c_tot = ws.cell(row=current_row, column=38, value=total_working)
        c_tot.alignment = Alignment(horizontal="center", vertical="center")
        c_tot.font = Font(name=font_name, size=9, bold=True)
        c_tot.border = thin_border

        c_pct = ws.cell(row=current_row, column=39, value=f"{att_pct:.2f}%")
        c_pct.alignment = Alignment(horizontal="center", vertical="center")
        pct_color = "15803D" if att_pct >= 75.0 else "DC2626"
        c_pct.font = Font(name=font_name, size=9, bold=True, color=pct_color)
        c_pct.border = thin_border

        current_row += 1

    # 6. Bottom Summary Section
    summary_start_row = current_row + 2
    total_students = len(students_data)
    total_classes = total_class_present + total_class_absent + total_class_leave
    avg_working_days = round(total_classes / max(total_students, 1))
    avg_pct = round((total_class_present / max(total_classes, 1)) * 100.0, 2)
    absent_pct = round((total_class_absent / max(total_classes, 1)) * 100.0, 2)
    leave_pct = round((total_class_leave / max(total_classes, 1)) * 100.0, 2)

    # --- Box 1: CLASS SUMMARY (Cols B to H) ---
    ws.merge_cells(start_row=summary_start_row, start_column=2, end_row=summary_start_row, end_column=8)
    b1_header = ws.cell(row=summary_start_row, column=2, value="CLASS SUMMARY")
    b1_header.font = Font(name=font_name, size=10, bold=True, color=COLOR_WHITE)
    b1_header.fill = header_fill
    b1_header.alignment = Alignment(horizontal="center", vertical="center")

    summary_rows = [
        ("Total Students", str(total_students)),
        ("Total Working Days", str(avg_working_days)),
        ("Total Present", str(total_class_present)),
        ("Total Absent", str(total_class_absent)),
        ("Total Leave", str(total_class_leave)),
        ("Average Attendance", f"{avg_pct:.2f}%"),
    ]
    for r_offset, (label, val) in enumerate(summary_rows, start=1):
        r_num = summary_start_row + r_offset
        ws.merge_cells(start_row=r_num, start_column=2, end_row=r_num, end_column=5)
        c_lbl = ws.cell(row=r_num, column=2, value=label)
        c_lbl.font = Font(name=font_name, size=9, bold=(r_offset in [1, 6]))
        c_lbl.alignment = Alignment(horizontal="left", vertical="center")
        c_lbl.border = thin_border

        ws.merge_cells(start_row=r_num, start_column=6, end_row=r_num, end_column=8)
        c_val = ws.cell(row=r_num, column=6, value=val)
        c_val.font = Font(name=font_name, size=9, bold=True, color="1E3A8A")
        c_val.alignment = Alignment(horizontal="center", vertical="center")
        c_val.border = thin_border

    # --- Box 2: ATTENDANCE SUMMARY (CLASS) (Cols K to T) ---
    ws.merge_cells(start_row=summary_start_row, start_column=11, end_row=summary_start_row, end_column=20)
    b2_header = ws.cell(row=summary_start_row, column=11, value="ATTENDANCE SUMMARY (CLASS)")
    b2_header.font = Font(name=font_name, size=10, bold=True, color=COLOR_WHITE)
    b2_header.fill = header_fill
    b2_header.alignment = Alignment(horizontal="center", vertical="center")

    stat_cards = [
        ("Present", total_class_present, COLOR_PRESENT_FILL, COLOR_PRESENT_FONT),
        ("Absent", total_class_absent, COLOR_ABSENT_FILL, COLOR_ABSENT_FONT),
        ("Leave", total_class_leave, COLOR_LEAVE_FILL, COLOR_LEAVE_FONT),
    ]
    for c_idx, (st_name, st_val, bg, fg) in enumerate(stat_cards):
        col_start = 11 + (c_idx * 3)
        col_end = col_start + 2
        r_top = summary_start_row + 2
        r_bot = summary_start_row + 4

        ws.merge_cells(start_row=r_top, start_column=col_start, end_row=r_bot, end_column=col_end)
        card_val = ws.cell(row=r_top, column=col_start, value=st_val)
        card_val.font = Font(name=font_name, size=16, bold=True, color=fg)
        card_val.fill = PatternFill(start_color=bg, end_color=bg, fill_type="solid")
        card_val.alignment = Alignment(horizontal="center", vertical="center")
        card_val.border = thin_border

        r_lbl = summary_start_row + 5
        ws.merge_cells(start_row=r_lbl, start_column=col_start, end_row=r_lbl, end_column=col_end)
        card_lbl = ws.cell(row=r_lbl, column=col_start, value=st_name)
        card_lbl.font = Font(name=font_name, size=9, bold=True, color="334155")
        card_lbl.alignment = Alignment(horizontal="center", vertical="center")
        card_lbl.border = thin_border

    # --- Box 3: ATTENDANCE PERCENTAGE (Cols W to AD) ---
    ws.merge_cells(start_row=summary_start_row, start_column=23, end_row=summary_start_row, end_column=30)
    b3_header = ws.cell(row=summary_start_row, column=23, value="ATTENDANCE PERCENTAGE")
    b3_header.font = Font(name=font_name, size=10, bold=True, color=COLOR_WHITE)
    b3_header.fill = header_fill
    b3_header.alignment = Alignment(horizontal="center", vertical="center")

    # Big Percentage Display
    ws.merge_cells(start_row=summary_start_row + 2, start_column=23, end_row=summary_start_row + 4, end_column=26)
    big_pct = ws.cell(row=summary_start_row + 2, column=23, value=f"{avg_pct:.2f}%")
    big_pct.font = Font(name=font_name, size=18, bold=True, color="15803D")
    big_pct.alignment = Alignment(horizontal="center", vertical="center")
    big_pct.border = thin_border

    pct_items = [
        ("Present", f"{avg_pct:.2f}%", COLOR_PRESENT_FONT),
        ("Absent", f"{absent_pct:.2f}%", COLOR_ABSENT_FONT),
        ("Leave", f"{leave_pct:.2f}%", COLOR_LEAVE_FONT),
    ]
    for p_offset, (p_lbl, p_val, col_fg) in enumerate(pct_items, start=2):
        r_p = summary_start_row + p_offset
        ws.cell(row=r_p, column=28, value=p_lbl).font = Font(name=font_name, size=8.5, bold=True)
        c_pval = ws.cell(row=r_p, column=30, value=p_val)
        c_pval.font = Font(name=font_name, size=8.5, bold=True, color=col_fg)
        c_pval.alignment = Alignment(horizontal="right", vertical="center")

    # --- Box 4: Remarks & Official Signatures (Cols AF to AM) ---
    rem_start_row = summary_start_row
    ws.cell(row=rem_start_row, column=32, value="Remarks:").font = Font(name=font_name, size=9.5, bold=True, color=COLOR_NAVY)
    
    ws.merge_cells(start_row=rem_start_row + 1, start_column=32, end_row=rem_start_row + 2, end_column=39)
    hol_note = ""
    if holidays_map:
        hol_str = "; ".join([f"{d:02d}-{month:02d}: {n}" for d, n in sorted(holidays_map.items())])
        hol_note = f"\nGovt Holidays: {hol_str}"
    rem_text = f"Computed till {generated_date.strftime('%d-%m-%Y')}. Attendance verified.{hol_note}"
    rem_box = ws.cell(row=rem_start_row + 1, column=32, value=rem_text)
    rem_box.font = Font(name=font_name, size=8.5, italic=True, color="334155")
    rem_box.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

    sig_row = summary_start_row + 5
    ws.merge_cells(start_row=sig_row, start_column=32, end_row=sig_row, end_column=35)
    sig_fac = ws.cell(row=sig_row, column=32, value="Signature of Faculty")
    sig_fac.font = Font(name=font_name, size=8.5, bold=True, color="475569")
    sig_fac.alignment = Alignment(horizontal="center", vertical="center")
    sig_fac.border = Border(top=Side(style='thin', color="334155"))

    ws.merge_cells(start_row=sig_row, start_column=37, end_row=sig_row, end_column=39)
    sig_hod = ws.cell(row=sig_row, column=37, value="HOD (CSE)")
    sig_hod.font = Font(name=font_name, size=8.5, bold=True, color="475569")
    sig_hod.alignment = Alignment(horizontal="center", vertical="center")
    sig_hod.border = Border(top=Side(style='thin', color="334155"))

    # 7. Footer
    footer_row = summary_start_row + 8
    ws.merge_cells(start_row=footer_row, start_column=2, end_row=footer_row, end_column=20)
    foot_left = ws.cell(row=footer_row, column=2, value="Face Recognition | Smart Tracking | Google Calendar Holidays Synced")
    foot_left.font = Font(name=font_name, size=8.5, italic=True, color="64748B")

    ws.merge_cells(start_row=footer_row, start_column=28, end_row=footer_row, end_column=39)
    foot_right = ws.cell(row=footer_row, column=28, value=f"Generated on : {generated_date.strftime('%d-%m-%Y')} (Till Date) | {datetime.now().strftime('%I:%M %p')}")
    foot_right.font = Font(name=font_name, size=8.5, color="64748B")
    foot_right.alignment = Alignment(horizontal="right", vertical="center")

    return wb


def generate_attendance_csv_matching_image(
    department_name: str,
    subject_code: str,
    subject_name: str,
    semester: int,
    section: str,
    faculty_name: str,
    year: int,
    month: int,
    students_data: List[Dict[str, Any]],
    generated_date: Optional[date] = None,
    holidays_map: Optional[Dict[int, str]] = None
) -> str:
    """
    Generates a CSV string containing the exact structure and content of the official attendance sheet.
    Adheres to Google Calendar Government Holidays and computes report data till date.
    """
    if generated_date is None:
        generated_date = date.today()
    if holidays_map is None:
        holidays_map = {}

    output = io.StringIO()
    writer = csv.writer(output)

    days_in_month = calendar.monthrange(year, month)[1]
    month_name = calendar.month_name[month]

    # Header
    writer.writerow(["RAJIV GANDHI INSTITUTE OF TECHNOLOGY", "BANGALORE"])
    writer.writerow([department_name.upper()])
    writer.writerow(["AI SMART ATTENDANCE SYSTEM USING FACE RECOGNITION"])
    writer.writerow(["—— STUDENT ATTENDANCE SHEET ——"])
    writer.writerow([])

    # Metadata & Legend
    writer.writerow([
        f"Class : {semester}th Semester",
        "",
        f"Date : {generated_date.strftime('%d-%m-%Y')} (Till Date)",
        "",
        "Legend: P = Present | A = Absent | L = Leave | H = Holiday / Govt Holiday (Google Calendar)"
    ])
    writer.writerow([
        f"Section : {section}",
        "",
        f"Month : {month_name} {year}",
        "",
        "Calendar : Google Calendar Indian Public Holidays Synced"
    ])
    subj_label = f"{subject_code} - {subject_name}" if subject_name else subject_code
    writer.writerow([
        f"Subject : {subj_label}",
        "",
        f"Faculty : {faculty_name}"
    ])
    if holidays_map:
        hol_str = " | ".join([f"{d:02d}-{month:02d}: {name}" for d, name in sorted(holidays_map.items())])
        writer.writerow(["Google Calendar Govt Holidays", hol_str])
    writer.writerow([])

    # Row 1: Day numbers
    day_headers_num = [str(d) for d in range(1, 32)]
    writer.writerow(["S. No.", "USN", "Student Name", "Department"] + day_headers_num + ["Present", "Absent", "Leave", "Total", "Attendance %"])

    # Row 2: Weekday names
    day_headers_day = []
    for d in range(1, 32):
        if d <= days_in_month:
            day_headers_day.append(get_weekday_abbr(year, month, d))
        else:
            day_headers_day.append("-")
    writer.writerow(["", "", "", ""] + day_headers_day + ["", "", "", "", ""])

    total_class_present = 0
    total_class_absent = 0
    total_class_leave = 0

    # Data Rows
    for idx, s in enumerate(students_data, start=1):
        usn = s.get("usn", "")
        name = s.get("full_name", s.get("name", ""))
        dept = s.get("department", department_name)
        daily_statuses = s.get("daily_statuses", {})

        row_statuses = []
        p_cnt = 0
        a_cnt = 0
        l_cnt = 0

        for d in range(1, 32):
            if d <= days_in_month:
                is_sun = (date(year, month, d).weekday() == 6)
                is_gov = (d in holidays_map)
                default_st = "H" if (is_sun or is_gov) else "P"
                st = daily_statuses.get(d, default_st)
                row_statuses.append(st)
                if st == "P": p_cnt += 1
                elif st == "A": a_cnt += 1
                elif st == "L": l_cnt += 1
            else:
                row_statuses.append("-")

        tot_w = max(p_cnt + a_cnt + l_cnt, 1)
        pct = round((p_cnt / tot_w) * 100.0, 2)

        total_class_present += p_cnt
        total_class_absent += a_cnt
        total_class_leave += l_cnt

        writer.writerow([idx, usn, name, dept] + row_statuses + [p_cnt, a_cnt, l_cnt, tot_w, f"{pct:.2f}%"])

    writer.writerow([])
    writer.writerow(["CLASS SUMMARY", "", "", "ATTENDANCE SUMMARY (CLASS)", "", "", "ATTENDANCE PERCENTAGE", "", "Remarks & Signatures"])
    total_students = len(students_data)
    total_classes = total_class_present + total_class_absent + total_class_leave
    avg_w_days = round(total_classes / max(total_students, 1))
    avg_pct = round((total_class_present / max(total_classes, 1)) * 100.0, 2)
    abs_pct = round((total_class_absent / max(total_classes, 1)) * 100.0, 2)
    l_pct = round((total_class_leave / max(total_classes, 1)) * 100.0, 2)

    hol_rem = ""
    if holidays_map:
        hol_rem = " Govt Holidays: " + "; ".join([f"{d:02d}-{month:02d}: {name}" for d, name in sorted(holidays_map.items())])
    writer.writerow(["Total Students", total_students, "", "Present", total_class_present, "", "Present %", f"{avg_pct:.2f}%", f"Remarks: Computed till {generated_date.strftime('%d-%m-%Y')}. Attendance verified.{hol_rem}"])
    writer.writerow(["Total Working Days", avg_w_days, "", "Absent", total_class_absent, "", "Absent %", f"{abs_pct:.2f}%"])
    writer.writerow(["Total Present", total_class_present, "", "Leave", total_class_leave, "", "Leave %", f"{l_pct:.2f}%"])
    writer.writerow(["Total Absent", total_class_absent])
    writer.writerow(["Total Leave", total_class_leave])
    writer.writerow(["Average Attendance", f"{avg_pct:.2f}%", "", "", "", "", "", "", "Signature of Faculty: __________________", "HOD (CSE): __________________"])
    writer.writerow([])
    writer.writerow(["Face Recognition | Smart Tracking | Google Calendar Holidays Synced", "", "", "", "", "", "", f"Generated on : {generated_date.strftime('%d-%m-%Y')} (Till Date) | {datetime.now().strftime('%I:%M %p')}"])

    return output.getvalue()
