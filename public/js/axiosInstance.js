import { showAlert } from "./alert.mjs";

// 1) Configure the shared instance
const axiosInstance = axios.create({
    baseURL: '/api/v1',
    withCredentials: true
});

// 2) Attach the global interceptor loop
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                await axiosInstance.post('/users/refreshToken');
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // We can use a direct window alert or handle it gracefully if alert.js isn't imported here
                showAlert('erorr', 'Your session has expired. Please log in again.');
                window.setTimeout(() => location.assign('/login'), 1500);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// 3) Export it so ANY frontend file can use it!
export default axiosInstance;