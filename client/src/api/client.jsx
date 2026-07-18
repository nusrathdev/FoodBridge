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
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default client;