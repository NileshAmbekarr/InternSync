import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('organization');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
    resendVerification: () => api.post('/auth/resend-verification'),
    invite: (data) => api.post('/auth/invite', data),
    acceptInvite: (token, data) => api.post(`/auth/accept-invite/${token}`, data),
};

// Reports API
export const reportsAPI = {
    // Intern endpoints
    create: (formData) => api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getMyReports: () => api.get('/reports/my'),
    update: (id, formData) => api.put(`/reports/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    submit: (id) => api.put(`/reports/${id}/submit`),
    undo: (id) => api.put(`/reports/${id}/undo`),
    delete: (id) => api.delete(`/reports/${id}`),

    // Admin endpoints
    getAll: (params) => api.get('/reports', { params }),
    getStats: () => api.get('/reports/stats'),
    getOne: (id) => api.get(`/reports/${id}`),
    grade: (id, data) => api.put(`/reports/${id}/grade`, data),

    // File download (R2 or local)
    getDownloadUrl: (id) => api.get(`/reports/download/${id}`),
};

// Users API
export const usersAPI = {
    getInterns: () => api.get('/users/interns'),
    getTeam: () => api.get('/users/team'),
    getOne: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => api.put('/users/profile', data),
    deactivate: (id) => api.put(`/users/${id}/deactivate`),
    reactivate: (id) => api.put(`/users/${id}/reactivate`),
};

export default api;
