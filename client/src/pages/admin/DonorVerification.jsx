import { useState, useEffect } from 'react';
import client, { errorMessage } from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function DonorVerification() {
    const [donors, setDonors] = useState([]);
    const [filter, setFilter] = useState('pending');
    // Which tab the current `donors` list belongs to. Until it matches `filter`, that tab is loading.
    const [loadedFilter, setLoadedFilter] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [actionId, setActionId] = useState(null);
    const [reason, setReason] = useState('');
    const [rejectingId, setRejectingId] = useState(null);
    const [error, setError] = useState('');

    const loading = loadedFilter !== filter;

    useEffect(() => {
        // Switching tabs quickly can leave an older request finishing last. `ignore` makes sure only
        // the request for the tab currently shown may update the list, otherwise the "approved"
        // tab could end up showing pending donors.
        let ignore = false;
        const fetchDonors = async () => {
            try {
                const { data } = await client.get(`/donors?status=${filter}`);
                if (ignore) return;
                setDonors(data);
                setError('');
            } catch (err) {
                if (ignore) return;
                setError(errorMessage(err, 'Failed to load donors'));
            }
            setLoadedFilter(filter);
        };
        fetchDonors();
        return () => { ignore = true; };
    }, [filter, reloadKey]);

    // Re-runs the effect above for the current tab.
    const refresh = () => setReloadKey(k => k + 1);

    const approve = async (id) => {
        setActionId(id);
        try {
            await client.patch(`/donors/${id}/verify`, { decision: 'approved' });
            refresh();
        } catch (err) {
            alert(errorMessage(err, 'Failed to approve donor'));
        } finally {
            setActionId(null);
        }
    };

    const reject = async (id) => {
        if (!reason.trim()) return alert('Please enter a rejection reason');
        setActionId(id);
        try {
            await client.patch(`/donors/${id}/verify`, { decision: 'rejected', reason });
            setRejectingId(null);
            setReason('');
            refresh();
        } catch (err) {
            alert(errorMessage(err, 'Failed to reject donor'));
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Donor Verification</h1>

                {/* Filter tabs */}
                <div className="flex gap-6 mb-6 border-b border-gray-200">
                    {['pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                                className={`pb-2 -mb-px border-b-2 text-sm font-medium capitalize transition-colors
                ${filter === s
                                    ? 'border-brand-600 text-brand-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}>
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-gray-400 text-center py-16">Loading...</p>
                ) : error ? (
                    <p className="text-red-500 text-center py-16">{error}</p>
                ) : donors.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm px-6 py-16 text-center text-gray-400">
                        No {filter} donors.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {donors.map(donor => (
                            <div key={donor.id}
                                 className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {donor.org_name || donor.name}
                      </span>
                                            <StatusBadge status={donor.status} />
                                        </div>
                                        <p className="text-sm text-gray-500">{donor.email}</p>
                                        {donor.food_handling_cert && (
                                            <p className="text-sm text-gray-500">
                                                Cert: {donor.food_handling_cert}
                                            </p>
                                        )}
                                        {donor.rejection_reason && (
                                            <p className="text-sm text-red-500">
                                                Reason: {donor.rejection_reason}
                                            </p>
                                        )}
                                    </div>

                                    {donor.status === 'pending' && (
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => approve(donor.id)}
                                                disabled={actionId === donor.id}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg
                                   text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => { setRejectingId(donor.id); setReason(''); }}
                                                className="border border-red-300 text-red-600 px-3 py-1.5
                                   rounded-lg text-sm font-medium hover:bg-red-50">
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Reject reason input */}
                                {rejectingId === donor.id && (
                                    <div className="mt-4 flex gap-2">
                                        <input
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            placeholder="Enter rejection reason..."
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2
                                 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                        />
                                        <button
                                            onClick={() => reject(donor.id)}
                                            disabled={actionId === donor.id}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm
                                 font-medium hover:bg-red-700 disabled:opacity-50">
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => { setRejectingId(null); setReason(''); }}
                                            className="border border-gray-300 text-gray-600 px-3 py-2
                                 rounded-lg text-sm hover:bg-gray-50">
                                            Cancel
                                        </button>
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