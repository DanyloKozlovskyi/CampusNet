import axios from "axios";
import { setCookie, getCookie } from "./helpers";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie("access_token");
    if (token) {
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

function readTokens() {
  const access = getCookie("access_token")?.split(" ")[1] ?? null;
  const refresh = getCookie("refresh_token")?.split(" ")[1] ?? null;
  return access && refresh ? { access, refresh } : null;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    const original = error.config;
    const shouldRefresh = response?.status === 401 && !original._retry;

    if (shouldRefresh) {
      original._retry = true;

      const tokens = readTokens();
      if (!tokens) {
        window.location.href = "/sign-in";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          "/account/refresh",
          {
            token: tokens.access,
            refreshToken: tokens.refresh,
          },
          { baseURL: api.defaults.baseURL },
        );

        setCookie("access_token", `Bearer ${data.token}`);
        setCookie("refresh_token", `Bearer ${data.refreshToken}`);

        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch (refreshErr) {
        const error = refreshErr as { response?: { status: number } };
        if (error.response?.status === 401) {
          window.location.href = "/sign-in";
        } else if (window.location.pathname !== "/something-went-wrong") {
          window.location.href = "/something-went-wrong";
        }
        return Promise.reject(refreshErr);
      }
    }

    if (response?.status === 403 && response?.data?.errors?.UserBanned) {
      setCookie("access_token", "");
      setCookie("refresh_token", "");
      window.location.href = "/sign-in?banned=true";
      return Promise.reject(error);
    }

    if (
      response?.status >= 500 &&
      window.location.pathname !== "/something-went-wrong"
    ) {
      window.location.href = "/something-went-wrong";
    }

    return Promise.reject(error);
  },
);

export default api;
