import { Routes, Route, Navigate } from 'react-router-dom';
import SeekersLanding from './pages/Marketing/SeekersLanding';
import EmployersLanding from './pages/Marketing/EmployersLanding';
import JobsList from './pages/Jobs/JobsList';
import JobDetails from './pages/Jobs/JobDetails';
import ProfileDashboard from './pages/Profile/ProfileDashboard';
import EditProfilePage from './pages/Profile/EditProfilePage';
import EmployerDashboard from './pages/Employer/EmployerDashboard';
import PostJob from './pages/Employer/PostJob';
import ApplicantsPipeline from './pages/Employer/ApplicantsPipeline';
import AdminDashboard from './pages/Admin/AdminDashboard';
import OrganizationsList from './pages/Admin/OrganizationsList';
import AdminProfile from './pages/Admin/AdminProfile';
import About from './pages/Marketing/About';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthModal } from './components/AuthModal';
import MessagesPage from './pages/Messages/MessagesPage';
import PublicOrganizationProfile from './pages/Marketing/OrganizationProfile';
import SeekerPublicProfile from './pages/Marketing/SeekerPublicProfile';

import OrganizationProfile from './pages/Employer/OrganizationProfile';
import OrganizationTeam from './pages/Employer/OrganizationTeam';
import JoinOrganization from './pages/Employer/JoinOrganization';
import EmployerProfile from './pages/Employer/EmployerProfile';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/seekers" replace />} />
        <Route path="/seekers" element={<SeekersLanding />} />
        <Route path="/employers" element={<EmployersLanding />} />
        <Route path="/about" element={<About />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/jobs/:slug" element={<JobDetails />} />
        {/* Login and register flows are now handled via modal triggered from the header */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        {/* Actually, I need to check ProtectedRoute limits. If it's strict, I might need two routes or a change. 
           Let's just import MessagesPage first. 
        */}
        <Route path="/seekers/dashboard" element={<ProtectedRoute requiredRole="seeker"><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/seekers/dashboard/edit" element={<ProtectedRoute requiredRole="seeker"><EditProfilePage /></ProtectedRoute>} />
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute requiredRole="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/post-job"
          element={
            <ProtectedRoute requiredRole="employer">
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:slug/edit"
          element={
            <ProtectedRoute requiredRole="employer">
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/applicants"
          element={
            <ProtectedRoute requiredRole="employer">
              <ApplicantsPipeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/applicants/:slug"
          element={
            <ProtectedRoute requiredRole="employer">
              <ApplicantsPipeline />
            </ProtectedRoute>
          }
        />
        <Route
        />
        <Route
          path="/employer/organization"
          element={
            <ProtectedRoute requiredRole="employer">
              <OrganizationProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/profile"
          element={
            <ProtectedRoute requiredRole="employer">
              <EmployerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/team"
          element={
            <ProtectedRoute requiredRole="employer">
              <OrganizationTeam />
            </ProtectedRoute>
          }
        />
        <Route path="/join" element={<JoinOrganization />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/organizations"
          element={
            <ProtectedRoute requiredRole="admin">
              <OrganizationsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/organizations/:orgName" element={<PublicOrganizationProfile />} />
        <Route path="/seekers/:id" element={<SeekerPublicProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
    </>
  );
}

export default App;
