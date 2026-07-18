import { useState, useEffect } from 'react';
import client from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function DonorVerification() {
    const [donors, setDonors] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [reason, setReason] = useState('');
    const [rejectingId, setRejectingId] = useState(null);

    useEffect(() => {
        fetchDonors();
    }, [filter]);

    const fetchDonors = async () => {
        setLoading(true);
        try {
            const { data } = await client.get(`/donors?status=${filter}`);
            setDonors(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const approve = async (id) => {
        setActionId(id);
        try {
            await client.patch(`/donors/${id}/verify`, { decision: 'approved' });
            fetchDonors();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed');
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
            fetchDonors();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed');
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
                <div className="flex gap-2 mb-6">
                    {['pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
                ${filter === s
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}>
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-gray-400 text-center py-16">Loading...</p>
                ) : donors.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm px-6 py-16 text-center text-gray-400">
                        No {filter} donors.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {donors.map(donor => (
                            <div key={donor.id}
                                 className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
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
                                                onClick={() => setRejectingId(donor.id)}
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