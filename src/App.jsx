import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import Layout from "./components/layout/Layout";
import InstallPrompt from "./components/InstallPrompt";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageLevels from "./pages/admin/ManageLevels";
import ManageClasses from "./pages/admin/ManageClasses";
import ManageTerms from "./pages/admin/ManageTerms";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageStudents from "./pages/admin/ManageStudents";
import Results from "./pages/admin/Results";
import Attendance from "./pages/admin/Attendance";
import Timetable from "./pages/admin/Timetable";
import PromoteStudents from "./pages/admin/PromoteStudents";
import ArchiveStudents from "./pages/admin/ArchiveStudents";
import SystemHealth from "./pages/admin/SystemHealth";
import SecurityLogs from "./pages/admin/SecurityLogs";
import AuditTrail from "./pages/admin/AuditTrail";
import ManageAdmins from "./pages/admin/ManageAdmins";
import DataBackup from "./pages/admin/DataBackup";
import StudentReports from "./pages/admin/StudentReports";
import ManageGallery from "./pages/admin/ManageGallery";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherResults from "./pages/teacher/EnterResults";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherTimetable from "./pages/teacher/Timetable";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentResults from "./pages/student/Results";
import StudentAttendance from "./pages/student/Attendance";
import StudentTimetable from "./pages/student/Timetable";
import MakeReport from "./pages/student/MakeReport";
import IDCard from "./pages/student/IDCard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <InstallPrompt />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            {/* Fallback: show Home for unknown paths */}
            <Route path="*" element={<Home />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/levels"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageLevels />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageClasses />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/terms"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageTerms />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageTeachers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageStudents />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <Results />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <Attendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <Timetable />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promote"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <PromoteStudents />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/archive"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ArchiveStudents />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system-health"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <SystemHealth />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <SecurityLogs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <AuditTrail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admins"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageAdmins />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/backup"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <DataBackup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <StudentReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/gallery"
              element={
                <ProtectedRoute role="admin">
                  <Layout role="admin">
                    <ManageGallery />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute role="teacher">
                  <Layout role="teacher">
                    <TeacherDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/results"
              element={
                <ProtectedRoute role="teacher">
                  <Layout role="teacher">
                    <TeacherResults />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute role="teacher">
                  <Layout role="teacher">
                    <TeacherAttendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/timetable"
              element={
                <ProtectedRoute role="teacher">
                  <Layout role="teacher">
                    <TeacherTimetable />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <Layout role="student">
                    <StudentDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute role="student">
                  <Layout role="student">
                    <StudentResults />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute role="student">
                  <Layout role="student">
                    <StudentAttendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/timetable"
              element={
                <ProtectedRoute role="student">
                  <Layout role="student">
                    <StudentTimetable />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/report"
              element={
                <ProtectedRoute role="student">
                  <Layout role="student">
                    <MakeReport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/id-card"
              element={
                <ProtectedRoute role="student">
                  <Layout role="student">
                    <IDCard />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
