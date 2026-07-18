const colors = {
    pending:     'bg-yellow-100 text-yellow-800',
    approved:    'bg-green-100 text-green-800',
    rejected:    'bg-red-100 text-red-800',
    available:   'bg-blue-100 text-blue-800',
    assigned:    'bg-purple-100 text-purple-800',
    collected:   'bg-orange-100 text-orange-800',
    distributed: 'bg-green-100 text-green-800',
    expired:     'bg-gray-100 text-gray-600',
    delivered:   'bg-green-100 text-green-800',
    cancelled:   'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
    );
}