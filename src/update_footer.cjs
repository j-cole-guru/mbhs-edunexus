const fs = require('fs');
const path = require('path');

const pages = [
  "src/pages/admin/Dashboard.jsx",
  "src/pages/admin/ManageLevels.jsx",
  "src/pages/admin/ManageClasses.jsx",
  "src/pages/admin/ManageTerms.jsx",
  "src/pages/admin/ManageTeachers.jsx",
  "src/pages/admin/ManageStudents.jsx",
  "src/pages/admin/ManageAdmins.jsx",
  "src/pages/admin/Results.jsx",
  "src/pages/admin/Attendance.jsx",
  "src/pages/admin/Timetable.jsx",
  "src/pages/admin/PromoteStudents.jsx",
  "src/pages/admin/SystemHealth.jsx",
  "src/pages/admin/SecurityLogs.jsx",
  "src/pages/admin/AuditTrail.jsx",
  "src/pages/admin/DataBackup.jsx",
  "src/pages/admin/StudentReports.jsx",
  "src/pages/teacher/Dashboard.jsx",
  "src/pages/teacher/Attendance.jsx",
  "src/pages/teacher/Timetable.jsx",
  "src/pages/teacher/EnterResults.jsx",
  "src/pages/student/Dashboard.jsx",
  "src/pages/student/Results.jsx",
  "src/pages/student/Attendance.jsx",
  "src/pages/student/Timetable.jsx",
  "src/pages/student/MakeReport.jsx",
  "src/pages/auth/Login.jsx"
];

const basePath = 'c:\\Users\\user\\Desktop\\mbhs-edunexus';
const oldText = '© 2026 All Rights Reserved | Developed by Alie Amadu Sesay';
const newText = "© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone. Developed by Alie Amadu Sesay";

pages.forEach(page => {
  const filePath = path.join(basePath, page);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace exact string matches
  if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    fs.writeFileSync(filePath, content, 'utf8');
  } else if (content.includes("© 2026 Methodist Boys' High School")) {
    // Already updated, ignore
  } else {
    // some might have slight formatting differences, let's try a regex
    content = content.replace(/© 2026 All Rights Reserved[\s\S]*?Alie Amadu Sesay/g, newText);
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Footers updated');
