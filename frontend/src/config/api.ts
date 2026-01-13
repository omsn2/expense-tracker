// API base URL - uses environment variable in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Helper function to make API calls with the correct base URL
export function apiUrl(path: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
}

// Helper function for fetch with API base URL
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    return fetch(apiUrl(path), options);
}

export default API_BASE_URL;
