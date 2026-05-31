# MBHS EduNexus - School Management System

A comprehensive school management system for Methodist Boys' High School in Sierra Leone, built with React, Vite, Tailwind CSS, and Supabase.

## Features

### Authentication System
- **Student Login**: Login with student number and 4-digit PIN
- **Staff Login**: Login with email and password (Supabase Auth)
- **Role-based Access**: Admin, Teacher, and Student portals

### Admin Features
- Dashboard with statistics
- Manage academic levels (JSS1, SS2, etc.)
- Manage classes and subjects
- Manage academic terms
- Create and manage teachers
- Create and manage students
- Enter and manage examination results
- Track student attendance
- Create and manage class timetables

### Teacher Features
- View assigned subjects and classes
- Enter examination results for assigned subjects
- Mark attendance for assigned classes
- View teaching timetable

### Student Features
- View personal information and class details
- Check examination results and GPA
- View attendance records
- Access class timetable

## Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Routing**: React Router v6
- **State Management**: React Context API

## Design System

### Colors
- Black: `#000000`
- White: `#FFFFFF`
- Deep Blue: `#1E3A8A`
- Light Gray: `#F1F5F9`
- Dark: `#0F172A`

### Typography
- Font: Inter (Google Fonts)
- Clean, professional institutional style
- Bold typography with blue accents

## Getting Started

This project is built with React, Vite, Tailwind CSS, and Supabase.

## Database Schema

### Tables
- `profiles` - User profiles with roles
- `levels` - Academic levels (JSS1, SS2, etc.)
- `classes` - Class assignments
- `subjects` - School subjects
- `terms` - Academic terms
- `students` - Student records
- `teachers` - Teacher records
- `teacher_subjects` - Teacher-subject assignments
- `results` - Examination results
- `attendance` - Attendance records
- `timetable` - Class schedules

### RPC Functions
- `student_login(student_number, pin)` - Authenticate students
- `generate_student_number()` - Auto-generate student IDs
- `generate_employee_number()` - Auto-generate teacher IDs

## Grading System

| Score Range | Grade | Description |
|-------------|-------|-------------|
| 75 - 100    | A1    | Excellent   |
| 70 - 74     | B2    | Very Good   |
| 65 - 69     | B3    | Very Good   |
| 60 - 64     | C4    | Good        |
| 55 - 59     | C5    | Good        |
| 50 - 54     | C6    | Good        |
| 45 - 49     | D7    | Fair        |
| 40 - 44     | E8    | Fair        |
| 0 - 39      | F9    | Poor        |

## GPA Calculation
GPA is calculated as the average of all subject scores for a given term.

## Project Structure

```
src/
├── assets/          # Static assets (logo, images)
├── components/      # Reusable components
│   └── layout/      # Layout components (Sidebar, Navbar, Layout)
├── context/         # React contexts (AuthContext)
├── lib/            # Utility libraries (Supabase client)
├── pages/          # Page components
│   ├── admin/      # Admin pages
│   ├── auth/       # Authentication pages
│   ├── student/    # Student pages
│   └── teacher/    # Teacher pages
├── routes/         # Route protection
├── App.jsx         # Main app component
├── main.jsx        # App entry point
└── index.css       # Global styles
```

## Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Security Features

- JWT-based authentication via Supabase Auth
- Role-based access control
- Protected routes for each user type
- Input validation and sanitization
- Secure password handling

## Footer

Every page includes the standard footer:
```
© 2026 All Rights Reserved | Developed by Alie Amadu Sesay
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

© 2026 Methodist Boys' High School. All rights reserved.

## Support

For technical support or questions, please contact the development team.

---

**Note**: This system is specifically designed for Methodist Boys' High School, Sierra Leone, and follows the educational standards and requirements of the Sierra Leonean education system.
