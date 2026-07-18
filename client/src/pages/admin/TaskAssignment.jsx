import { useState, useEffect } from 'react';
import client from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function TaskAssignment() {
    const [posts, setPosts] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);
    const [selected, setSelected] = useState({});

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [postsRes, volRes, tasksRes] = await Promise.all([
                    client.get('/food-posts'),
                    client.get('/volunteers'),
                    client.get('/tasks'),
                ]);
                setPosts(postsRes.data.filter(p => p.status === 'available'));
                setVolunteers(volRes.data);
                setTasks(tasksRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const assign = async (postId) => {
        const volunteerId = selected[postId];
        if (!volunteerId) return alert('Please select a volunteer');
        setAssigning(postId);
        try {
            await client.post('/tasks', {
                food_post_id: postId,
                volunteer_id: volunteerId,
            });
            // refresh lists
            const [postsRes, tasksRes] = await Promise.all([
                client.get('/food-posts'),
                client.get('/tasks'),
            ]);
            setPosts(postsRes.data.filter(p => p.status === 'available'));
            setTasks(tasksRes.data);
            setSelected(s => { const n = { ...s }; delete n[postId]; return n; });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to assign');
        } finally {
            setAssigning(null);
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Task Assignment</h1>

                {/* Available food posts */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Available Food Posts ({posts.length})
                    </h2>
                    {posts.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm px-6 py-10 text-center text-gray-400">
                            No available food posts to assign.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {posts.map(post => (
                                <div key={post.id}
                                     className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <p className="font-semibold text-gray-800">{post.food_type}</p>
                                            <p className="text-sm text-gray-500">
                                                {post.quantity} · {post.pickup_address}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Donor: {post.donor_name} ({post.org_name})
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Pickup: {new Date(post.pickup_window_start).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={selected[post.id] || ''}
                                                onChange={e => setSelected(s => ({ ...s, [post.id]: e.target.value }))}
                                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-brand-500">
                                                <option value="">Select volunteer</option>
                                                {volunteers.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} ({v.active_tasks} active)
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => assign(post.id)}
                                                disabled={assigning === post.id}
                                                className="bg-brand-600 text-white px-4 py-2 rounded-lg
                                   text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                                                {assigning === post.id ? 'Assigning...' : 'Assign'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Active tasks */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        All Tasks ({tasks.length})
                    </h2>
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm px-6 py-10 text-center text-gray-400">
                            No tasks yet.
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Food</th>
                                    <th className="px-6 py-3 text-left">Donor</th>
                                    <th className="px-6 py-3 text-left">Volunteer</th>
                                    <th className="px-6 py-3 text-left">Assigned</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-800">
                                            {task.food_type}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{task.donor_org}</td>
                                        <td className="px-6 py-3 text-gray-600">{task.volunteer_name}</td>
                                        <td className="px-6 py-3 text-gray-400 text-xs">
                                            {new Date(task.assigned_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <StatusBadge status={task.status} />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}