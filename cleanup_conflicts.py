from pathlib import Path
files = [
    Path('src/pages/admin/ArchiveStudents.jsx'),
    Path('src/pages/teacher/Attendance.jsx'),
    Path('src/pages/admin/ManageClasses.jsx'),
    Path('src/pages/admin/ManageTerms.jsx'),
    Path('src/pages/student/Dashboard.jsx')
]
for f in files:
    t = f.read_text(encoding='utf-8')
    if '<<<<<<<' not in t:
        print(f'{f}: no conflict markers')
        continue
    # keep second branch contents only from each conflict block;
    # this is an approximation but our files contain duplicated conflict-wrapped content
    pieces = t.split('<<<<<<<')
    out = pieces[0]
    for piece in pieces[1:]:
        if '>>>>>>>' in piece:
            after = piece.split('>>>>>>>', 1)[1]
            # take second block only
            second = piece.split('=======', 1)[1].split('>>>>>>>', 1)[0]
            out += second + after
        else:
            out += piece
    f.write_text(out, encoding='utf-8')
    print(f'{f}: cleaned conflict markers')
