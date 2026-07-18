import { useState, useEffect } from 'react';
import client from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function MyPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data } = await client.get('/food-posts');
            setPosts(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (post) => {
        setEditingId(post.id);
        setEditForm({
            food_type: post.food_type,
            quantity: post.quantity,
            pickup_address: post.pickup_address,
        });
    };

    const saveEdit = async (id) => {
        setSaving(true);
        try {
            await client.patch(`/food-posts/${id}`, editForm);
            setEditingId(null);
            fetchPosts();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Loading...</p>
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
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Food Posts</h1>

                {posts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm px-6 py-16 text-center text-gray-400">
                        No posts yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id}
                                 className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                {editingId === post.id ? (
                                    // Edit mode
                                    <div className="space-y-3">
                                        {['food_type', 'quantity', 'pickup_address'].map(key => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                                                    {key.replace('_', ' ')}
                                                </label>
                                                <input
                                                    value={editForm[key]}
                                                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2
                                     text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                            </div>
                                        ))}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => saveEdit(post.id)}
                                                disabled={saving}
                                                className="bg-brand-600 text-white px-4 py-1.5 rounded-lg
                                   text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="border border-gray-300 text-gray-600 px-4 py-1.5
                                   rounded-lg text-sm hover:bg-gray-50">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View mode
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">{post.food_type}</span>
                                                <StatusBadge status={post.status} />
                                            </div>
                                            <p className="text-sm text-gray-500">Quantity: {post.quantity}</p>
                                            <p className="text-sm text-gray-500">Address: {post.pickup_address}</p>
                                            <p className="text-xs text-gray-400">
                                                Pickup: {new Date(post.pickup_window_start).toLocaleString()}
                                                {' → '}
                                                {new Date(post.pickup_window_end).toLocaleString()}
                                            </p>
                                        </div>
                                        {post.status === 'available' && (
                                            <button
                                                onClick={() => startEdit(post)}
                                                className="text-sm text-brand-600 hover:underline shrink-0">
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}