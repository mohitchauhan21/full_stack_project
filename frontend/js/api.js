const API_URL = '/api';

const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.msg || `Request failed with status ${response.status}`);
    }

    return data;
};
