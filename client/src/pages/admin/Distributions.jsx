import { useState, useEffect } from 'react';
import client from '../../api/client';
import Navbar from '../../components/Navbar';

export default function Distributions() {
    const [distributions, setDistributions] = useState([]);
    const [collectedTasks, setCollectedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        task_id: '',
        recipient_group: '',
        quantity_distributed: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [distRes, tasksRes] = await Promise.all([
                client.get('/distributions'),
                client.get('/tasks'),
            ]);
            setDistributions(distRes.data);
            setCollectedTasks(tasksRes.data.filter(t => t.status === 'collected'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await client.post('/distributions', form);
            setSuccess('Distribution logged successfully');
            setForm({ task_id: '', recipient_group: '', quantity_distributed: '', notes: '' });
            fetchAll();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log distribution');
        } finally {
            setSubmitting(false);
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
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Distributions</h1>

                {/* Log new distribution */}
                {collectedTasks.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                        <h2 className="font-semibold text-gray-800 mb-4">Log New Distribution</h2>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                              px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 text-sm
                              px-4 py-3 rounded-lg mb-4">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Collected task <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.task_id}
                                    onChange={e => setForm(f => ({ ...f, task_id: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500">
                                    <option value="">Select a collected task</option>
                                    {collectedTasks.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.food_type} — collected by {t.volunteer_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient group <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    value={form.recipient_group}
                                    onChange={e => setForm(f => ({ ...f, recipient_group: e.target.value }))}
                                    placeholder="e.g. Galle Road Community Shelter"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity distributed <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    value={form.quantity_distributed}
                                    onChange={e => setForm(f => ({ ...f, quantity_distributed: e.target.value }))}
                                    placeholder="e.g. 48 packets"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    placeholder="Any remarks about this distribution..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium
                           py-2 rounded-lg transition-colors disabled:opacity-50">
                                {submitting ? 'Logging...' : 'Log distribution'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Distribution history */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">
                            Distribution History ({distributions.length})
                        </h2>
                    </div>
                    {distributions.length === 0 ? (
                        <div className="px-6 py-16 text-center text-gray-400 text-sm">
                            No distributions logged yet.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">Food</th>
                                <th className="px-6 py-3 text-left">Donor</th>
                                <th className="px-6 py-3 text-left">Recipient</th>
                                <th className="px-6 py-3 text-left">Qty</th>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Volunteer</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {distributions.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-800">{d.food_type}</td>
                                    <td className="px-6 py-3 text-gray-600">{d.donor_org}</td>
                                    <td className="px-6 py-3 text-gray-600">{d.recipient_group}</td>
                                    <td className="px-6 py-3 text-gray-600">{d.quantity_distributed}</td>
                                    <td className="px-6 py-3 text-gray-400 text-xs">
                                        {new Date(d.distributed_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">{d.collected_by_volunteer}</td>
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