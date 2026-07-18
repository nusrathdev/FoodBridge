import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'donor',
        org_name: '', food_handling_cert: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await client.post('/auth/register', form);
            navigate('/login');
        } catch (err) {
            const errs = err.response?.data?.errors;
            setError(errs ? errs.map(e => e.msg).join(', ') : err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
                <p className="text-gray-500 text-sm mb-6">Join FoodBridge as a donor or volunteer</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                        <input required value={form.name}
                               onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" required value={form.email}
                               onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" required minLength={6} value={form.password}
                               onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                        <select value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                            <option value="donor">Donor (organisation)</option>
                            <option value="volunteer">Volunteer</option>
                        </select>
                    </div>

                    {form.role === 'donor' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Organisation name <span className="text-red-500">*</span>
                                </label>
                                <input required value={form.org_name}
                                       onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))}
                                       className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Food handling certificate <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input value={form.food_handling_cert}
                                       onChange={e => setForm(f => ({ ...f, food_handling_cert: e.target.value }))}
                                       placeholder="e.g. NGO-FH-2026-00231"
                                       className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
                <p className="text-sm text-gray-500 mt-4 text-center">
                    Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}