import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || "/api").trim().replace(/\/+$/, "");
const baseURL = rawApiUrl.endsWith("/api") || rawApiUrl === "" ? rawApiUrl || "/api" : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL,
  timeout: 90000,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      const currentPath = window.location.pathname;
      if (
        currentPath !== "/login" &&
        currentPath !== "/signup" &&
        currentPath !== "/"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
