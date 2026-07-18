import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/Unauthorized';

import DonorDashboard from './pages/donor/Dashboard';
import PostFood from './pages/donor/PostFood';
import MyPosts from './pages/donor/MyPosts';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import DonorVerification from './pages/admin/DonorVerification.jsx';
import TaskAssignment from './pages/admin/TaskAssignment';
import Distributions from './pages/admin/Distributions';

import VolunteerTasks from './pages/volunteer/Tasks';

function RoleHome() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'volunteer') return <Navigate to="/volunteer/tasks" replace />;
    return <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<RoleHome />} />

            {/* Donor */}
            <Route path="/donor/dashboard" element={
                <ProtectedRoute roles={['donor']}><DonorDashboard /></ProtectedRoute>
            }/>
            <Route path="/donor/post-food" element={
                <ProtectedRoute roles={['donor']}><PostFood /></ProtectedRoute>
            }/>
            <Route path="/donor/my-posts" element={
                <ProtectedRoute roles={['donor']}><MyPosts /></ProtectedRoute>
            }/>

            {/* Admin */}
            <Route path="/admin/dashboard" element={
                <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            }/>
            <Route path="/admin/donors" element={
                <ProtectedRoute roles={['admin']}><DonorVerification /></ProtectedRoute>
            }/>
            <Route path="/admin/tasks" element={
                <ProtectedRoute roles={['admin']}><TaskAssignment /></ProtectedRoute>
            }/>
            <Route path="/admin/distributions" element={
                <ProtectedRoute roles={['admin']}><Distributions /></ProtectedRoute>
            }/>

            {/* Volunteer */}
            <Route path="/volunteer/tasks" element={
                <ProtectedRoute roles={['volunteer']}><VolunteerTasks /></ProtectedRoute>
            }/>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}