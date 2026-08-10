import axios from "axios";

// Base URL (env first, fallback to localhost:8000)
const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (token + ngrok fix)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Fix for ngrok warning
    config.headers["ngrok-skip-browser-warning"] = "true";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// (Optional but very useful) Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here if needed
    if (error.response) {
      console.error("API Error:", error.response.data);
    } else {
      console.error("Network Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;