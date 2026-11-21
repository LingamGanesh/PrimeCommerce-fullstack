import axios from "axios";
import SummaryApi, { baseUrl } from "../common/SummaryApi";

const Axios = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

// Authentication is carried by HttpOnly cookies; never read tokens from localStorage.
// Share one refresh request across concurrent 401 responses because refresh tokens
// are single-use and rotated atomically by the server.
let refreshPromise = null;
const refreshAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = axios.post(
            `${baseUrl}${SummaryApi.refreshToken.url}`,
            {},
            { withCredentials: true }
        )
            .then((response) => response?.data?.success === true)
            .catch(() => false)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
};

// ================= RESPONSE INTERCEPTOR =================
Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const publicAuthEndpoints = [
            SummaryApi.login.url,
            SummaryApi.register.url,
            SummaryApi.forgot_password.url,
            SummaryApi.forgot_password_verification_otp.url,
            SummaryApi.resetPassword.url,
            "/api/user/verify-email",
            SummaryApi.refreshToken.url,
        ];
        const isPublicAuthRequest = publicAuthEndpoints.some((endpoint) =>
            originalRequest?.url?.includes(endpoint)
        );

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isPublicAuthRequest) {
            originalRequest._retry = true;
            const refreshed = await refreshAccessToken();
            if (refreshed) return Axios(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default Axios;