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

        // 1) CRITICAL CHECK: If the error came from the login endpoint, DO NOT RETRY.
        // It means the user genuinely typed a wrong email or password!
        if (originalRequest.url.includes('/users/login') || originalRequest.url.includes('/login')) {
            return Promise.reject(error);
        }

        // 2) Prevent infinite loops if the refresh token endpoint itself returns a 401
        if (originalRequest.url.includes('/refresh-token') || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                await axiosInstance.post('/users/refreshToken');
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                
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
