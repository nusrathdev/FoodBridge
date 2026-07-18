import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Navbar from '../../components/Navbar';

const StatCard = ({ label, value, sub, color = 'text-brand-600' }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
);

export default function AdminDashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await client.get('/analytics/summary');
                setSummary(data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleDownload = async (type) => {
        try {
            const res = await client.get(`/reports/distributions.${type}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `foodbridge-distributions.${type}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Download failed');
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

    const fp = summary.food_posts;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-1">Live operational overview</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleDownload('csv')}
                                className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg
                         text-sm hover:bg-gray-50 transition-colors">
                            Export CSV
                        </button>
                        <button onClick={() => handleDownload('pdf')}
                                className="bg-brand-600 text-white px-3 py-1.5 rounded-lg
                         text-sm hover:bg-brand-700 transition-colors">
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Posts" value={fp.total} />
                    <StatCard label="Distributed" value={fp.distributed}
                              color="text-green-600" />
                    <StatCard label="Expired (waste)" value={fp.expired}
                              color="text-red-500" />
                    <StatCard label="Total Distributions"
                              value={summary.total_distributions} />
                </div>

                {/* Rates */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-2">Collection rate</p>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <div
                                className="bg-brand-500 h-3 rounded-full transition-all"
                                style={{ width: `${summary.rates.collection_rate}%` }}
                            />
                        </div>
                        <p className="text-xl font-bold text-gray-800 mt-2">
                            {summary.rates.collection_rate}%
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-2">Waste rate</p>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <div
                                className="bg-red-400 h-3 rounded-full transition-all"
                                style={{ width: `${summary.rates.waste_rate}%` }}
                            />
                        </div>
                        <p className="text-xl font-bold text-gray-800 mt-2">
                            {summary.rates.waste_rate}%
                        </p>
                    </div>
                </div>

                {/* Food post breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {[
                        { label: 'Available', value: fp.available, color: 'bg-blue-50 text-blue-700' },
                        { label: 'Assigned', value: fp.assigned, color: 'bg-purple-50 text-purple-700' },
                        { label: 'Collected', value: fp.collected, color: 'bg-orange-50 text-orange-700' },
                        { label: 'Distributed', value: fp.distributed, color: 'bg-green-50 text-green-700' },
                        { label: 'Expired', value: fp.expired, color: 'bg-red-50 text-red-700' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs font-medium mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Top donors */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">Top Donors</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left">Organisation</th>
                            <th className="px-6 py-3 text-left">Posts donated</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {summary.top_donors.map((d, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium text-gray-800">{d.org_name}</td>
                                <td className="px-6 py-3 text-gray-600">{d.posts_donated}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                    {[
                        { label: 'Verify Donors', to: '/admin/donors', color: 'bg-yellow-500' },
                        { label: 'Assign Tasks', to: '/admin/tasks', color: 'bg-purple-500' },
                        { label: 'Log Distribution', to: '/admin/distributions', color: 'bg-green-600' },
                    ].map(link => (
                        <Link key={link.to} to={link.to}
                              className={`${link.color} text-white rounded-xl p-4 text-center
                          font-medium text-sm hover:opacity-90 transition-opacity`}>
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}