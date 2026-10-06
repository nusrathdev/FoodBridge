import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const navLinks = {
    donor: [
        { label: 'Dashboard', to: '/donor/dashboard' },
        { label: 'Post Food', to: '/donor/post-food' },
        { label: 'My Posts', to: '/donor/my-posts' },
    ],
    admin: [
        { label: 'Dashboard', to: '/admin/dashboard' },
        { label: 'Donors', to: '/admin/donors' },
        { label: 'Recipients', to: '/admin/recipients' },
        { label: 'Tasks', to: '/admin/tasks' },
        { label: 'Distributions', to: '/admin/distributions' },
    ],
    volunteer: [
        { label: 'My Tasks', to: '/volunteer/tasks' },
    ],
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        // On narrow screens the links drop to their own row so nothing is pushed off-screen.
        <nav className="bg-brand-700 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 shadow">
            <span className="font-bold text-lg tracking-tight">FoodBridge</span>
            <div className="order-last sm:order-none w-full sm:w-auto flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                {(navLinks[user?.role] || []).map(link => (
                    <NavLink key={link.to} to={link.to}
                             className={({ isActive }) =>
                                 `hover:text-brand-100 transition-colors ${isActive ? 'underline underline-offset-4' : ''}`}>
                        {link.label}
                    </NavLink>
                ))}
            </div>
            <div className="flex items-center gap-3 text-sm min-w-0">
                <span className="text-brand-100 truncate max-w-[9rem] sm:max-w-none">{user?.name}</span>
                <button onClick={handleLogout}
                        className="bg-white text-brand-700 px-3 py-1 rounded font-medium hover:bg-brand-50 transition-colors shrink-0">
                    Logout
                </button>
            </div>
        </nav>
    );
}
