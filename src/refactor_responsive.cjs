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
  "src/pages/student/MakeReport.jsx"
];

const newFooter = `<footer className="mt-8 py-4 border-t border-gray-200 text-center">
  <p className="text-xs text-gray-400">
    © 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.
  </p>
  <p className="text-xs text-gray-400 mt-1">
    Developed by Alie Amadu Sesay
  </p>
</footer>`;

const basePath = 'c:\\Users\\user\\Desktop\\mbhs-edunexus';

pages.forEach(page => {
  const filePath = path.join(basePath, page);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace grids
  content = content.replace(/grid grid-cols-4 gap-4/g, 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4');
  content = content.replace(/grid grid-cols-3 gap-4/g, 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4');
  content = content.replace(/grid grid-cols-2 gap-4/g, 'grid grid-cols-1 sm:grid-cols-2 gap-4');
  content = content.replace(/grid grid-cols-2 md:grid-cols-4 gap-4/g, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4');
  content = content.replace(/grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4/g, 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4');
  content = content.replace(/grid grid-cols-2 lg:grid-cols-4 gap-4/g, 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4');
  
  // Make tables scrollable
  content = content.replace(/<table className="w-full text-sm">/g, '<table className="w-full text-sm min-w-[600px]">');
  
  let parts = content.split('<table');
  if (parts.length > 1) {
    let newContent = parts[0];
    for (let i = 1; i < parts.length; i++) {
      if (!newContent.endsWith('<div className="overflow-x-auto">\\n') && !newContent.match(/<div className="overflow-x-auto">\\s*$/)) {
         newContent += '<div className="overflow-x-auto">\\n<table' + parts[i].replace('</table>', '</table>\\n</div>');
      } else {
         newContent += '<table' + parts[i];
      }
    }
    content = newContent;
  }
  
  // Replace buttons
  content = content.replace(/<button\s+([^>]*)className="([^"]+)"/g, (match, prefix, classNames) => {
    if (!classNames.includes('w-full') && !classNames.includes('absolute')) {
       return '<button ' + prefix + 'className="w-full md:w-auto ' + classNames + '"';
    }
    return match;
  });
  
  content = content.replace(/<button onClick=\{([^}]+)\}\s+className="([^"]+)"/g, (match, fn, classNames) => {
    if (!classNames.includes('w-full') && !classNames.includes('absolute') && !classNames.includes('w-10')) {
       return '<button onClick={' + fn + '} className="w-full md:w-auto ' + classNames + '"';
    }
    return match;
  });

  // Footer replace using string split to avoid regex bugs
  const fStart = '<div className="mt-8 text-center text-sm text-gray-400">';
  if (content.includes(fStart) && content.includes('Alie Amadu Sesay')) {
    const p1 = content.split(fStart);
    let finalContent = p1[0];
    for(let i=1; i<p1.length; i++){
       const p2 = p1[i].split('</div>');
       if (p2[0].includes('Alie Amadu Sesay') || p2[0].includes('© 2026')) {
          finalContent += newFooter + p2.slice(1).join('</div>');
       } else {
          finalContent += fStart + p1[i];
       }
    }
    content = finalContent;
  }
  
  // And for gray-500 if any
  const fStart2 = '<div className="mt-8 text-center text-sm text-gray-500">';
  if (content.includes(fStart2) && content.includes('Alie Amadu Sesay')) {
    const p1 = content.split(fStart2);
    let finalContent = p1[0];
    for(let i=1; i<p1.length; i++){
       const p2 = p1[i].split('</div>');
       if (p2[0].includes('Alie Amadu Sesay') || p2[0].includes('© 2026')) {
          finalContent += newFooter + p2.slice(1).join('</div>');
       } else {
          finalContent += fStart2 + p1[i];
       }
    }
    content = finalContent;
  }

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Done refactoring pages');
