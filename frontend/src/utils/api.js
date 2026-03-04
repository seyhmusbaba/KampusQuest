import axios from "axios";

function getBaseURL() {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  const port = process.env.REACT_APP_BACKEND_PORT || "5000";
  const host = window.location.hostname;
  return `http://${host}:${port}/api`;
}

export function getSocketURL() {
  if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
  const port = process.env.REACT_APP_BACKEND_PORT || "5000";
  const host = window.location.hostname;
  return `http://${host}:${port}`;
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});

// Her isteğe JWT ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusgame_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 intercept — SADECE /auth/me endpoint'i gerçek "token geçersiz" sinyalidir.
// game/* endpoint'leri geçici 401 verebilir (sunucu yeniden başlatma vb.)
// ve asla kullanıcıyı oyundan atmamalı.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || "";
      const isAuthMe = url.endsWith("/auth/me") || url.includes("/auth/me?");
      if (isAuthMe) {
        localStorage.removeItem("campusgame_token");
        localStorage.removeItem("campusgame_user");
        window.dispatchEvent(new Event("auth:logout"));
      }
      // Diğer tüm 401'ler sessizce reddedilir — kullanıcı atılmaz
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:      (data) => api.post("/auth/register", data),
  login:         (data) => api.post("/auth/login", data),
  logout:        ()     => api.post("/auth/logout"),
  me:            ()     => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/profile", data),
};

export const gameAPI = {
  memories:      (locationId)        => api.get(`/game/memories/${locationId}`),
  leaderboard:   ()                  => api.get("/game/leaderboard"),
  onlinePlayers: ()                  => api.get("/game/online-players"),
  messages:      (roomId, params={}) => api.get(`/game/messages/${roomId}`, { params }),
  stats:         ()                  => api.get("/game/stats"),
  claimXP:       (data)              => api.post("/game/claim-xp", data),
};

export default api;
