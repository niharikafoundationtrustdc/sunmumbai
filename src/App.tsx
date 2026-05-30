import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DashboardLayout } from './components/Layout/DashboardLayout';

// Lazy load components
const Login = lazy(() => import('./modules/Auth/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./modules/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const PaperSetter = lazy(() => import('./modules/PaperSetter/PaperSetter').then(m => ({ default: m.PaperSetter })));
const Attendance = lazy(() => import('./modules/Attendance/Attendance').then(m => ({ default: m.Attendance })));
const Fees = lazy(() => import('./modules/Fees/Fees').then(m => ({ default: m.Fees })));
const Library = lazy(() => import('./modules/Library/Library').then(m => ({ default: m.Library })));
const Exams = lazy(() => import('./modules/Exams/Exams').then(m => ({ default: m.Exams })));
const Students = lazy(() => import('./modules/Students/Students').then(m => ({ default: m.Students })));
const Settings = lazy(() => import('./modules/Settings/Settings').then(m => ({ default: m.Settings })));
const Admissions = lazy(() => import('./modules/Admissions/Admissions').then(m => ({ default: m.Admissions })));
const Faculty = lazy(() => import('./modules/Faculty/Faculty').then(m => ({ default: m.Faculty })));
const Reports = lazy(() => import('./modules/Reports/Reports').then(m => ({ default: m.Reports })));
const Courses = lazy(() => import('./modules/Courses/Courses').then(m => ({ default: m.Courses })));
const FrontOffice = lazy(() => import('./modules/FrontOffice/FrontOffice').then(m => ({ default: m.FrontOffice })));
const Parents = lazy(() => import('./modules/Parents/Parents').then(m => ({ default: m.Parents })));
const ParentPanel = lazy(() => import('./modules/Parents/ParentPanel').then(m => ({ default: m.ParentPanel })));
const Results = lazy(() => import('./modules/Results/Results').then(m => ({ default: m.Results })));
const Income = lazy(() => import('./modules/Income/Income').then(m => ({ default: m.Income })));
const Expenses = lazy(() => import('./modules/Expenses/Expenses').then(m => ({ default: m.Expenses })));
const Profile = lazy(() => import('./modules/Profile/Profile').then(m => ({ default: m.Profile })));
const Communication = lazy(() => import('./modules/Communication/Communication').then(m => ({ default: m.Communication })));
const StudentPanel = lazy(() => import('./modules/Students/StudentPanel').then(m => ({ default: m.StudentPanel })));
const FacultyPanel = lazy(() => import('./modules/Faculty/FacultyPanel').then(m => ({ default: m.FacultyPanel })));
const StaffPanel = lazy(() => import('./modules/Staff/StaffPanel').then(m => ({ default: m.StaffPanel })));
const AccountantPanel = lazy(() => import('./modules/Accountant/AccountantPanel').then(m => ({ default: m.AccountantPanel })));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Librarian only has access to library or profile
  if (user.role === 'LIBRARIAN') {
    if (location.pathname !== '/library' && location.pathname !== '/profile') {
      return <Navigate to="/library" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackPath = user.role === 'LIBRARIAN' ? '/library' : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/paper-setter" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'FACULTY']}>
                  <PaperSetter />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'FACULTY']}>
                  <Attendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fees" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'ACCOUNTANT']}>
                  <Fees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/income" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'ACCOUNTANT']}>
                  <Income />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/expenses" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'ACCOUNTANT']}>
                  <Expenses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exams" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'FACULTY']}>
                  <Exams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admissions" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'STAFF']}>
                  <Admissions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'STAFF']}>
                  <Faculty />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/courses" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'FACULTY']}>
                  <Courses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'STAFF', 'LIBRARIAN']}>
                  <Library />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/front-office" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'STAFF']}>
                  <FrontOffice />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parents" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'STAFF']}>
                  <Parents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'FACULTY']}>
                  <Results />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/students" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'STAFF']}>
                  <Students />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student-panel" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'SUPER_ADMIN', 'COLLEGE_ADMIN']}>
                  <StudentPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty-panel" 
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'SUPER_ADMIN', 'COLLEGE_ADMIN']}>
                  <FacultyPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parent-panel" 
              element={
                <ProtectedRoute allowedRoles={['PARENT', 'SUPER_ADMIN', 'COLLEGE_ADMIN']}>
                  <ParentPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff-panel" 
              element={
                <ProtectedRoute allowedRoles={['STAFF', 'SUPER_ADMIN', 'COLLEGE_ADMIN']}>
                  <StaffPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/accountant-panel" 
              element={
                <ProtectedRoute allowedRoles={['ACCOUNTANT', 'SUPER_ADMIN', 'COLLEGE_ADMIN']}>
                  <AccountantPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL']}>
                  <Communication />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            {/* Fallback for other routes */}
            <Route 
              path="*" 
              element={
                <ProtectedRoute>
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl">🚧</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Module Under Construction</h2>
                    <p className="text-slate-500 max-w-md">
                      We're working hard to bring this feature to you. Please check back later!
                    </p>
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
