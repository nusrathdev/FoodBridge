import { useState, useEffect, useCallback } from 'react';
import client, { errorMessage } from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

// "Delivered to" value for a place that is not on the NGO's list (e.g. street people at a station).
const OTHER = 'other';

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function VolunteerTasks() {
    const [tasks, setTasks] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [error, setError] = useState('');
    // The task whose "record the delivery" form is open, and that form's values.
    const [deliveringId, setDeliveringId] = useState(null);
    const [delivery, setDelivery] = useState({});
    const [deliveryError, setDeliveryError] = useState('');

    const loadTasks = useCallback(async () => {
        const [tasksRes, recipientsRes] = await Promise.all([
            client.get('/tasks'),
            client.get('/recipients'),
        ]);
        setTasks(tasksRes.data);
        setRecipients(recipientsRes.data);
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                await loadTasks();
            } catch (err) {
                // Without this the page would claim "No active tasks" when the request simply failed.
                setError(errorMessage(err, 'Failed to load tasks'));
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [loadTasks]);

    const updateStatus = async (taskId, status) => {
        setActionId(taskId);
        try {
            await client.patch(`/tasks/${taskId}/status`, { status });
            await loadTasks();
        } catch (err) {
            alert(errorMessage(err, 'Failed to update'));
        } finally {
            setActionId(null);
        }
    };

    const openDelivery = (task) => {
        // Start from the admin's suggestion when there is one. The volunteer can change it.
        const suggested = recipients.some(r => r.id === task.recipient_id) ? task.recipient_id : '';
        setDelivery({
            recipient_choice: suggested || (recipients.length ? '' : OTHER),
            recipient_group: '',
            quantity_distributed: task.quantity,
            notes: '',
        });
        setDeliveryError('');
        setDeliveringId(task.id);
    };

    const submitDelivery = async (e, taskId) => {
        e.preventDefault();
        setDeliveryError('');
        const isOther = delivery.recipient_choice === OTHER;
        setActionId(taskId);
        try {
            await client.patch(`/tasks/${taskId}/status`, {
                status: 'delivered',
                recipient_id: isOther ? undefined : delivery.recipient_choice,
                recipient_group: isOther ? delivery.recipient_group : undefined,
                quantity_distributed: delivery.quantity_distributed,
                notes: delivery.notes,
            });
            setDeliveringId(null);
            await loadTasks();
        } catch (err) {
            setDeliveryError(errorMessage(err, 'Failed to record the delivery'));
        } finally {
            setActionId(null);
        }
    };

    const setField = (key, value) => setDelivery(d => ({ ...d, [key]: value }));

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
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">My Tasks</h1>

                {/* Active tasks */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Active ({active.length})
                    </h2>
                    {active.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm px-6 py-12 text-center text-gray-400">
                            No active tasks assigned to you.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {active.map(task => (
                                <div key={task.id}
                                     className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                                    <div className="space-y-1 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-800">{task.food_type}</span>
                                            <StatusBadge status={task.status} />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Quantity: {task.quantity}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Pickup: {task.pickup_address} ({task.donor_org})
                                        </p>
                                        <p className="text-sm text-gray-800">
                                            <span className="font-medium">Suggested destination:</span>{' '}
                                            {task.recipient_name
                                                ? `${task.recipient_name}, ${task.recipient_address}`
                                                : 'None. You choose who receives the food.'}
                                        </p>
                                        {task.recipient_phone && (
                                            <p className="text-sm text-gray-500">
                                                Recipient contact: {task.recipient_phone}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            Window: {new Date(task.pickup_window_start).toLocaleString()}
                                            {' → '}
                                            {new Date(task.pickup_window_end).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Action buttons based on current status */}
                                    {task.status === 'assigned' && (
                                        <div className="flex gap-2">
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
                                        </div>
                                    )}

                                    {task.status === 'collected' && deliveringId !== task.id && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <button
                                                onClick={() => openDelivery(task)}
                                                className="bg-brand-600 text-white px-4 py-2 rounded-lg
                                 text-sm font-medium hover:bg-brand-700">
                                                Mark Delivered
                                            </button>
                                            <p className="text-sm text-gray-500">
                                                Hand the food over, then record who received it.
                                            </p>
                                        </div>
                                    )}

                                    {/* Record the delivery: who received it, how much, any notes */}
                                    {deliveringId === task.id && (
                                        <form onSubmit={e => submitDelivery(e, task.id)}
                                              className="border-t border-gray-100 pt-4 space-y-3">
                                            <h3 className="text-sm font-semibold text-gray-800">Record the delivery</h3>

                                            {deliveryError && (
                                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                                                    {deliveryError}
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Delivered to <span className="text-red-500">*</span>
                                                </label>
                                                <select required value={delivery.recipient_choice}
                                                        onChange={e => setField('recipient_choice', e.target.value)}
                                                        className={inputClass}>
                                                    <option value="">Choose who received the food</option>
                                                    {recipients.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                    <option value={OTHER}>Somewhere else (describe it)</option>
                                                </select>
                                            </div>

                                            {delivery.recipient_choice === OTHER && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Who received it, and where <span className="text-red-500">*</span>
                                                    </label>
                                                    <input required value={delivery.recipient_group}
                                                           onChange={e => setField('recipient_group', e.target.value)}
                                                           placeholder="e.g. Street people near Kamalapur Railway Station"
                                                           className={inputClass} />
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quantity delivered <span className="text-red-500">*</span>
                                                </label>
                                                <input required value={delivery.quantity_distributed}
                                                       onChange={e => setField('quantity_distributed', e.target.value)}
                                                       className={inputClass} />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                                                </label>
                                                <textarea rows={2} value={delivery.notes}
                                                          onChange={e => setField('notes', e.target.value)}
                                                          placeholder="e.g. Shared among 30 people, all eaten on the spot"
                                                          className={`${inputClass} resize-none`} />
                                            </div>

                                            <div className="flex gap-2">
                                                <button type="submit" disabled={actionId === task.id}
                                                        className="bg-brand-600 text-white px-4 py-2 rounded-lg
                                     text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                                                    {actionId === task.id ? 'Saving...' : 'Confirm delivery'}
                                                </button>
                                                <button type="button" onClick={() => setDeliveringId(null)}
                                                        className="border border-gray-300 text-gray-600 px-4 py-2
                                     rounded-lg text-sm hover:bg-gray-50">
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
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
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Food</th>
                                    <th className="px-6 py-3 text-left">Donor</th>
                                    <th className="px-6 py-3 text-left">Delivered to</th>
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
                                        <td className="px-6 py-3 text-gray-600">{task.delivered_to || '-'}</td>
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
