import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function DonorDashboard() {
    const { user } = useAuth();
    const [status, setStatus] = useState(null);     // donor verification status
    const [posts, setPosts] = useState([]);          // food posts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Two API calls at the same time — faster than waiting for one then the other
                const [statusRes, postsRes] = await Promise.all([
                    client.get('/donors/me'),
                    client.get('/food-posts'),
                ]);
                setStatus(statusRes.data);
                setPosts(postsRes.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Welcome */}
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Welcome, {user.name}
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    {status?.org_name} · Verification: <StatusBadge status={status?.status} />
                </p>

                {/* Pending warning */}
                {status?.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
                        Your account is pending verification by the NGO administrator.
                        You cannot post food until approved.
                    </div>
                )}

                {/* Rejected warning */}
                {status?.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
                        Your registration was rejected.
                        Reason: {status.rejection_reason || 'No reason provided'}
                    </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Posts', value: posts.length },
                        { label: 'Available', value: posts.filter(p => p.status === 'available').length },
                        { label: 'Distributed', value: posts.filter(p => p.status === 'distributed').length },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                            <p className="text-3xl font-bold text-brand-600">{stat.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Action button */}
                {status?.status === 'approved' && (
                    <div className="mb-6">
                        <Link to="/donor/post-food"
                              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            + Post Surplus Food
                        </Link>
                    </div>
                )}

                {/* Posts table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">My Food Posts</h2>
                    </div>
                    {posts.length === 0 ? (
                        <div className="px-6 py-10 text-center text-gray-400 text-sm">
                            No food posts yet.
                            {status?.status === 'approved' && (
                                <span> <Link to="/donor/post-food" className="text-brand-600 hover:underline">Create your first post</Link></span>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">Food Type</th>
                                <th className="px-6 py-3 text-left">Quantity</th>
                                <th className="px-6 py-3 text-left">Pickup Window</th>
                                <th className="px-6 py-3 text-left">Status</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-800">{post.food_type}</td>
                                    <td className="px-6 py-3 text-gray-600">{post.quantity}</td>
                                    <td className="px-6 py-3 text-gray-500">
                                        {new Date(post.pickup_window_start).toLocaleString()} —
                                        {new Date(post.pickup_window_end).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={post.status} />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
}