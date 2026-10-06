import { useState, useEffect, useCallback } from 'react';
import client, { errorMessage } from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function TaskAssignment() {
    const [posts, setPosts] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);
    // per food post: { volunteer_id, recipient_id }
    const [selected, setSelected] = useState({});
    const [error, setError] = useState('');

    const loadAll = useCallback(async () => {
        const [postsRes, volRes, tasksRes, recRes] = await Promise.all([
            client.get('/food-posts'),
            client.get('/volunteers'),
            client.get('/tasks'),
            client.get('/recipients'),
        ]);
        setPosts(postsRes.data.filter(p => p.status === 'available'));
        setVolunteers(volRes.data);
        setTasks(tasksRes.data);
        // retired recipients stay in history but can't receive new deliveries
        setRecipients(recRes.data.filter(r => r.active));
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                await loadAll();
            } catch (err) {
                setError(errorMessage(err, 'Failed to load tasks'));
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [loadAll]);

    const choose = (postId, field, value) =>
        setSelected(s => ({ ...s, [postId]: { ...s[postId], [field]: value } }));

    const assign = async (postId) => {
        const { volunteer_id, recipient_id } = selected[postId] || {};
        if (!volunteer_id) return alert('Please select a volunteer');
        setAssigning(postId);
        try {
            await client.post('/tasks', {
                food_post_id: postId,
                volunteer_id,
                // optional: the volunteer makes the final choice when delivering
                recipient_id: recipient_id || undefined,
            });
            setSelected(s => { const n = { ...s }; delete n[postId]; return n; });
            // refresh lists, including volunteers so their "active" counts stay correct
            await loadAll();
        } catch (err) {
            alert(errorMessage(err, 'Failed to assign'));
            // The usual cause is another admin assigning the same post first. Reload so it disappears.
            loadAll().catch(() => {});
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
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Task Assignment</h1>

                {/* Available food posts */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Available Food Posts ({posts.length})
                    </h2>
                    {posts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm px-6 py-10 text-center text-gray-400">
                            No available food posts to assign.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {posts.map(post => (
                                <div key={post.id}
                                     className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <p className="font-semibold text-gray-800">{post.food_type}</p>
                                            <p className="text-sm text-gray-500">
                                                {post.quantity}, pickup at {post.pickup_address}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Donor: {post.donor_name} ({post.org_name})
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Pickup: {new Date(post.pickup_window_start).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                            <select
                                                aria-label="Volunteer"
                                                value={selected[post.id]?.volunteer_id || ''}
                                                onChange={e => choose(post.id, 'volunteer_id', e.target.value)}
                                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-brand-500">
                                                <option value="">Select volunteer</option>
                                                {volunteers.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} ({v.active_tasks} active)
                                                    </option>
                                                ))}
                                            </select>
                                            {recipients.length > 0 && (
                                                <select
                                                    aria-label="Suggested destination"
                                                    value={selected[post.id]?.recipient_id || ''}
                                                    onChange={e => choose(post.id, 'recipient_id', e.target.value)}
                                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-brand-500">
                                                    <option value="">Destination: volunteer decides</option>
                                                    {recipients.map(r => (
                                                        <option key={r.id} value={r.id}>Suggest: {r.name}</option>
                                                    ))}
                                                </select>
                                            )}
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
                        <div className="bg-white rounded-lg shadow-sm px-6 py-10 text-center text-gray-400">
                            No tasks yet.
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Food</th>
                                    <th className="px-6 py-3 text-left">Donor</th>
                                    <th className="px-6 py-3 text-left">Volunteer</th>
                                    <th className="px-6 py-3 text-left">Destination</th>
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
                                        <td className="px-6 py-3 text-gray-600">
                                            {task.delivered_to
                                                ? task.delivered_to
                                                : task.recipient_name
                                                    ? `${task.recipient_name} (suggested)`
                                                    : <span className="text-gray-400">Volunteer decides</span>}
                                        </td>
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