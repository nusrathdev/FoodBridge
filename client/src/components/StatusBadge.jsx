// Status is shown as plain coloured text. The colour carries the state; there is no pill behind it.
const colors = {
    pending:     'text-yellow-700',
    approved:    'text-green-700',
    rejected:    'text-red-700',
    available:   'text-blue-700',
    assigned:    'text-purple-700',
    collected:   'text-orange-700',
    distributed: 'text-green-700',
    expired:     'text-gray-500',
    delivered:   'text-green-700',
    cancelled:   'text-red-700',
};

export default function StatusBadge({ status }) {
    return (
        <span className={`text-xs font-semibold capitalize ${colors[status] || 'text-gray-500'}`}>
            {status}
        </span>
    );
}
