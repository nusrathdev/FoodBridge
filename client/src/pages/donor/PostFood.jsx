import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { errorMessage } from '../../api/client';
import Navbar from '../../components/Navbar';

export default function PostFood() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        food_type: '',
        quantity: '',
        pickup_address: '',
        pickup_window_start: '',
        pickup_window_end: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (new Date(form.pickup_window_end) <= new Date(form.pickup_window_start)) {
            setError('The pickup window must end after it starts.');
            return;
        }
        setLoading(true);
        try {
            await client.post('/food-posts', form);
            navigate('/donor/my-posts');
        } catch (err) {
            setError(errorMessage(err, 'Failed to create post'));
        } finally {
            setLoading(false);
        }
    };

    const field = (label, key, type = 'text', required = true, extra = {}) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                required={required}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...extra}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Post Surplus Food</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        List food available for collection by volunteers.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                          px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}
                      className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                    {field('Food type', 'food_type')}
                    {field('Quantity (e.g. 50 packets)', 'quantity')}
                    {field('Pickup address', 'pickup_address')}
                    {field('Pickup window start', 'pickup_window_start', 'datetime-local')}
                    {field('Pickup window end', 'pickup_window_end', 'datetime-local', true,
                        // the picker will not offer an end time earlier than the chosen start
                        { min: form.pickup_window_start || undefined })}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium
                         py-2 rounded-lg transition-colors disabled:opacity-50">
                            {loading ? 'Posting...' : 'Post food'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/donor/dashboard')}
                            className="flex-1 border border-gray-300 text-gray-700 font-medium
                         py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}