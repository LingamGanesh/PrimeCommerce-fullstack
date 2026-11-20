import axios from "axios";
import SummaryApi, { baseUrl } from "../common/SummaryApi";

const Axios = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

// Authentication is carried by HttpOnly cookies; never read tokens from localStorage.
const refreshAccessToken = async () => {
    try {
        const response = await axios.post(
            `${baseUrl}${SummaryApi.refreshToken.url}`,
            {},
            { withCredentials: true }
        );
        return response?.data?.success === true;
    } catch {
        return false;
    }
};

// ================= RESPONSE INTERCEPTOR =================
Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshtoken");

            if (refreshToken) {
                const newAccessToken = await refreshAccessToken(refreshToken);

                if (newAccessToken) {
                    return Axios(originalRequest);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default Axios;