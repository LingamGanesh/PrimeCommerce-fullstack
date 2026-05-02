import axios from "axios";
import SummaryApi, { baseUrl } from "../common/SummaryApi";

const Axios = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

// ================= TOKEN ATTACH =================
Axios.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accesstoken");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ================= REFRESH LOGIC =================
const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios.post(
            `${baseUrl}${SummaryApi.refreshToken.url}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            }
        );

        const newAccessToken = response?.data?.data?.accessToken;

        if (newAccessToken) {
            localStorage.setItem("accesstoken", newAccessToken);
        }

        return newAccessToken;
    } catch (error) {
        console.log("Refresh token failed:", error);
        return null;
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
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return Axios(originalRequest);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default Axios;