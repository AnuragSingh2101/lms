import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Attach Authorization header if token exists
API.interceptors.request.use(
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

// Intercept responses for auth errors (e.g. deactivated users)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and reload or let context handle it
      if (error.response.status === 403 && error.response.data?.message?.includes('deactivated')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?msg=deactivated';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
