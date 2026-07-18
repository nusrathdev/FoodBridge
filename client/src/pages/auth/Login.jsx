import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await client.post('/auth/login', form);
            login(data.token, { name: data.name, role: data.role });
            if (data.role === 'admin') navigate('/admin/dashboard');
            else if (data.role === 'donor') navigate('/donor/dashboard');
            else navigate('/volunteer/tasks');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">FoodBridge</h1>
                <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" required value={form.email}
                               onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                               placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" required value={form.password}
                               onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                               placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <p className="text-sm text-gray-500 mt-4 text-center">
                    Don't have an account? <Link to="/register" className="text-brand-600 hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
}