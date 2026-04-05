import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const api = axios.create({
  baseURL: "/api/v1", // Using base URL. User mentioned /api/v1 prefix
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Handle refresh cookies automatically.
});

// Access token interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { logout, setAuth } = useAuthStore.getState();

    // 401: Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Assume call to refresh token endpoint
        const response = await axios.post("/api/v1/auth/refresh", {}, {
            withCredentials: true // For setting/getting httpOnly cookies
        });
        
        const { access_token, user } = response.data;
        
        // Update store
        setAuth(user, access_token);
        
        // Update original request headers and retry
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
