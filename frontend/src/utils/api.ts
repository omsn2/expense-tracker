// Get API base URL from environment variable or use localhost for development
const getApiUrl = () => {
    // In production build, VITE_API_URL will be baked in
    // In development, it will use localhost
    if (typeof window !== 'undefined') {
        // Check if we're in production (deployed)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return 'https://expense-tracker-backend-rouge.vercel.app';
        }
    }
    return ''; // Empty string means use relative URLs (proxy in dev)
};

export const API_URL = getApiUrl();

// Helper to build full API URL
export const apiUrl = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return API_URL ? `${API_URL}${cleanPath}` : cleanPath;
};
