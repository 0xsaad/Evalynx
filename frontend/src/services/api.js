import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
console.log("🔧 API Base URL:", apiUrl);
console.log("🔧 Environment:", import.meta.env);

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response;

      const isAuthEndpoint =
        config.url?.includes("/auth/login") ||
        config.url?.includes("/auth/register");
      if (status === 401 && !isAuthEndpoint) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }

      const errorMessage =
        data?.error?.message || data?.message || "An error occurred";
      error.message = errorMessage;
    } else if (error.request) {
      error.message = "Network error. Please check your connection.";
    } else {
      error.message = error.message || "An unexpected error occurred";
    }

    return Promise.reject(error);
  }
);

export default api;
