import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
});

// Attach JWT to every request automatically — no component ever touches localStorage directly.
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle token expiry globally — if the server says 401, clear the session and
// redirect to login. This catches expired tokens without each component needing
// to handle it individually.
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // A 401 from /auth/login only means "wrong email or password". The Login page shows
        // that message itself, so redirecting here would reload the page and wipe it.
        const isAuthRequest = error.config?.url?.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Turns any failed request into one readable sentence for the UI.
export function errorMessage(err, fallback) {
    // No response at all means the request never reached the API (server down, no network).
    if (!err.response) return 'Cannot reach the server. Please try again in a moment.';
    const { errors, error } = err.response.data || {};
    if (errors?.length) return errors.map(e => e.msg).join(', ');
    return error || fallback;
}

export default client;