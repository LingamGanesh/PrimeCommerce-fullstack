import axios from "axios";
import SummaryApi, { baseUrl } from "../common/SummaryApi";

const Axios = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

// Authentication is cookie-based. Access and refresh tokens remain HttpOnly
// and are never copied into localStorage or JavaScript-readable headers.
let refreshPromise = null;

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry ||
        originalRequest.url?.includes(SummaryApi.refreshToken.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ||= axios.post(
      `${baseUrl}${SummaryApi.refreshToken.url}`,
      {},
      { withCredentials: true }
    ).finally(() => {
      refreshPromise = null;
    });

    try {
      await refreshPromise;
      return Axios(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default Axios;