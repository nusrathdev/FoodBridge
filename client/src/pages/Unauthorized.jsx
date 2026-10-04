import { Link } from 'react-router-dom';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow p-8 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
                <p className="text-gray-500 text-sm mb-6">
                    Your account does not have permission to view this page.
                </p>
                {/* "/" sends each role to its own home page */}
                <Link to="/"
                      className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                    Back to my home page
                </Link>
            </div>
        </div>
    );
}
