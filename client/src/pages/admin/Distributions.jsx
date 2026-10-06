import { useState, useEffect, useCallback } from 'react';
import client, { errorMessage } from '../../api/client';
import Navbar from '../../components/Navbar';

// Volunteers record each distribution themselves when they mark a task delivered.
// This page lets the admin follow food that is on its way and review what was handed out.
export default function Distributions() {
    const [distributions, setDistributions] = useState([]);
    const [onTheWay, setOnTheWay] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadAll = useCallback(async () => {
        const [distRes, tasksRes] = await Promise.all([
            client.get('/distributions'),
            client.get('/tasks'),
        ]);
        setDistributions(distRes.data);
        setOnTheWay(tasksRes.data.filter(t => t.status === 'collected'));
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                await loadAll();
            } catch (err) {
                setLoadError(errorMessage(err, 'Failed to load distributions'));
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [loadAll]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Loading...</p>
            </div>
        </div>
    );

    if (loadError) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">{loadError}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Distributions</h1>
                <p className="text-gray-500 text-sm mb-8">
                    Volunteers record who received the food when they mark a task delivered.
                </p>

                {/* Collected but not yet handed over */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">On the Way ({onTheWay.length})</h2>
                    </div>
                    {onTheWay.length === 0 ? (
                        <div className="px-6 py-10 text-center text-gray-400 text-sm">
                            No collected food is waiting to be delivered.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Food</th>
                                    <th className="px-6 py-3 text-left">Volunteer</th>
                                    <th className="px-6 py-3 text-left">Collected</th>
                                    <th className="px-6 py-3 text-left">Suggested destination</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {onTheWay.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-800">{t.food_type}</td>
                                        <td className="px-6 py-3 text-gray-600">{t.volunteer_name}</td>
                                        <td className="px-6 py-3 text-gray-400 text-xs">
                                            {t.collected_at ? new Date(t.collected_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {t.recipient_name || <span className="text-gray-400">Volunteer decides</span>}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Distribution history */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">
                            Distribution History ({distributions.length})
                        </h2>
                    </div>
                    {distributions.length === 0 ? (
                        <div className="px-6 py-16 text-center text-gray-400 text-sm">
                            No distributions recorded yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Food</th>
                                    <th className="px-6 py-3 text-left">Donor</th>
                                    <th className="px-6 py-3 text-left">Received by</th>
                                    <th className="px-6 py-3 text-left">Qty</th>
                                    <th className="px-6 py-3 text-left">Date</th>
                                    <th className="px-6 py-3 text-left">Volunteer</th>
                                    <th className="px-6 py-3 text-left">Notes</th>
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
                                        <td className="px-6 py-3 text-gray-500 text-xs">{d.notes || '-'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
