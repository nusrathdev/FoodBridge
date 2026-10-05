import { useState, useEffect, useCallback } from 'react';
import client, { errorMessage } from '../../api/client';
import Navbar from '../../components/Navbar';

const EMPTY_FORM = { name: '', address: '', contact_phone: '' };

export default function Recipients() {
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [togglingId, setTogglingId] = useState(null);

    const loadRecipients = useCallback(async () => {
        const { data } = await client.get('/recipients');
        setRecipients(data);
    }, []);

    useEffect(() => {
        const fetchRecipients = async () => {
            try {
                await loadRecipients();
            } catch (err) {
                setLoadError(errorMessage(err, 'Failed to load recipients'));
            } finally {
                setLoading(false);
            }
        };
        fetchRecipients();
    }, [loadRecipients]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await client.post('/recipients', form);
            setForm(EMPTY_FORM);
            await loadRecipients();
        } catch (err) {
            setError(errorMessage(err, 'Failed to add recipient'));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (recipient) => {
        setTogglingId(recipient.id);
        try {
            await client.patch(`/recipients/${recipient.id}`, { active: !recipient.active });
            await loadRecipients();
        } catch (err) {
            alert(errorMessage(err, 'Failed to update recipient'));
        } finally {
            setTogglingId(null);
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

    if (loadError) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">{loadError}</p>
            </div>
        </div>
    );

    const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Recipients</h1>
                <p className="text-gray-500 text-sm mb-8">
                    The places food is delivered to. You choose one when assigning a task, and the
                    volunteer sees its address.
                </p>

                {/* Add recipient */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-8">
                    <h2 className="font-semibold text-gray-800 mb-4">Add Recipient</h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input required value={form.name}
                                   onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                   placeholder="e.g. Street Children Shelter, Tejgaon"
                                   className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input required value={form.address}
                                   onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                   className={inputClass} />
                        </div>
                        <div className="sm:w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact phone <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input value={form.contact_phone}
                                   onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                                   className={inputClass} />
                        </div>
                        <button type="submit" disabled={saving}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg
                         text-sm transition-colors disabled:opacity-50">
                            {saving ? 'Adding...' : 'Add recipient'}
                        </button>
                    </form>
                </div>

                {/* Recipient list */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">All Recipients ({recipients.length})</h2>
                    </div>
                    {recipients.length === 0 ? (
                        <div className="px-6 py-16 text-center text-gray-400 text-sm">
                            No recipients yet. Add one above before assigning tasks.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Name</th>
                                    <th className="px-6 py-3 text-left">Address</th>
                                    <th className="px-6 py-3 text-left">Phone</th>
                                    <th className="px-6 py-3 text-left">Deliveries</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left"></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {recipients.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className={`px-6 py-3 font-medium ${r.active ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {r.name}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{r.address}</td>
                                        <td className="px-6 py-3 text-gray-600">{r.contact_phone || '-'}</td>
                                        <td className="px-6 py-3 text-gray-600">{r.deliveries}</td>
                                        <td className={`px-6 py-3 text-xs font-semibold ${r.active ? 'text-green-700' : 'text-gray-500'}`}>
                                            {r.active ? 'Active' : 'Inactive'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => toggleActive(r)}
                                                    disabled={togglingId === r.id}
                                                    className="text-sm text-brand-600 hover:underline disabled:opacity-50 whitespace-nowrap">
                                                {r.active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </td>
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
