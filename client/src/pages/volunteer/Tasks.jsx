import { useState, useEffect } from 'react';
import client from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function VolunteerTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data } = await client.get('/tasks');
            setTasks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (taskId, status) => {
        setActionId(taskId);
        try {
            await client.patch(`/tasks/${taskId}/status`, { status });
            fetchTasks();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update');
        } finally {
            setActionId(null);
        }
    };

    const active = tasks.filter(t => !['delivered', 'cancelled'].includes(t.status));
    const history = tasks.filter(t => ['delivered', 'cancelled'].includes(t.status));

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
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">My Tasks</h1>

                {/* Active tasks */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Active ({active.length})
                    </h2>
                    {active.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm px-6 py-12 text-center text-gray-400">
                            No active tasks assigned to you.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {active.map(task => (
                                <div key={task.id}
                                     className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">{task.food_type}</span>
                                                <StatusBadge status={task.status} />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Quantity: {task.quantity}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Pickup: {task.pickup_address}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Donor: {task.donor_org}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Window: {new Date(task.pickup_window_start).toLocaleString()}
                                                {' → '}
                                                {new Date(task.pickup_window_end).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons based on current status */}
                                    <div className="flex gap-2">
                                        {task.status === 'assigned' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(task.id, 'collected')}
                                                    disabled={actionId === task.id}
                                                    className="bg-brand-600 text-white px-4 py-2 rounded-lg
                                     text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                                                    {actionId === task.id ? 'Updating...' : 'Mark Collected'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Cancel this task? The food post will return to available.'))
                                                            updateStatus(task.id, 'cancelled');
                                                    }}
                                                    disabled={actionId === task.id}
                                                    className="border border-red-300 text-red-600 px-4 py-2 rounded-lg
                                     text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                                                    Cancel Task
                                                </button>
                                            </>
                                        )}
                                        {task.status === 'collected' && (
                                            <div className="bg-orange-50 border border-orange-200 text-orange-700
                                      px-4 py-2 rounded-lg text-sm">
                                                Food collected — waiting for admin to log distribution.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Task history */}
                {history.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">
                            History ({history.length})
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Food</th>
                                    <th className="px-6 py-3 text-left">Donor</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Assigned</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {history.map(task => (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-800">
                                            {task.food_type}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{task.donor_org}</td>
                                        <td className="px-6 py-3">
                                            <StatusBadge status={task.status} />
                                        </td>
                                        <td className="px-6 py-3 text-gray-400 text-xs">
                                            {new Date(task.assigned_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}