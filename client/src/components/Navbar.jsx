import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const navLinks = {
    donor: [
        {label: 'Dashboard', to: '/donor/dashboard'},
        {label: 'Post Food', to: '/donor/post-food'},
        {label: 'My Posts', to: '/donor/my-posts'},
    ],
    admin: [
        {label: 'Dashboard', to: '/admin/dashboard'},
        {label: 'Donors', to: '/admin/donors'},
        {label: 'Tasks', to: '/admin/tasks'},
        {label: 'Distributions', to: '/admin/distributions'},
    ],
    volunteer: [
        {label: 'My Tasks', to: '/volunteer/tasks'},
    ],
};

export default function Navbar() {
    const {user, logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-brand-700 text-white px-6 py-3 flex items-center justify-between shadow">
            <span className="font-bold text-lg tracking-tight">
                <Link to={navLinks[user.role]?.find(i => i.label === 'Dashboard')?.to || '#'}>
                    FoodBridge
                </Link>
            </span>
            <div className="flex items-center gap-6 text-sm">
                {(navLinks[user?.role] || []).map(link => (
                    <Link key={link.to} to={link.to}
                          className="hover:text-brand-100 transition-colors">
                        {link.label}
                    </Link>
                ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
                <span className="text-brand-100">{user?.name}</span>
                <button onClick={handleLogout}
                        className="bg-white text-brand-700 px-3 py-1 rounded font-medium hover:bg-brand-50 transition-colors">
                    Logout
                </button>
            </div>
        </nav>
    );
}