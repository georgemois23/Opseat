import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Check if the error is 401 and not already a retry
    // 2. IMPORTANT: Don't try to refresh if the failed request was the refresh call itself!
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        return api(originalRequest);
      } catch (refreshError) {
        // Just reject. Don't redirect here.
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;