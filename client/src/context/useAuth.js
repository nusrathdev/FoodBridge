import { createContext, useContext } from 'react';

// Lives outside AuthContext.jsx so that file exports only a component, which is what
// lets Vite hot-reload it instead of refreshing the whole page.
export const AuthContext = createContext(null);

// Custom hook — components call useAuth() not useContext(AuthContext) directly.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
