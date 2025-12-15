// authService.js
import axios from "axios";

class AuthService {
  constructor() {
    this.tokenKey = "authToken"; // ✅ Use 'authToken' for consistency
    this.refreshTokenKey = "refreshToken";
    this.userKey = "user";
    this.baseURL = "http://localhost:8000"; 

    this.api = axios.create({
      baseURL: this.baseURL,
    });

    this.setupInterceptors();
  }

  // -------------------------
  //     UTILITIES
  // -------------------------
  isAuthenticated() {
    return !!this.getToken();
  }

  getAuthHeaders() {
    const token = this.getToken();
    if (!token) {
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await axios.post(`${this.baseURL}/lms/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess = res.data.access;
      localStorage.setItem(this.tokenKey, newAccess);

      return newAccess;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
  
  // -------------------------
  //     TOKEN HANDLING
  // -------------------------
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setSession(access, refresh, user) {
    localStorage.setItem(this.tokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);

    if (user) {
      // Save specific user data extracted from login response (as done in login.jsx)
      localStorage.setItem("userId", user.user_id); 
      localStorage.setItem("username", user.username);
      localStorage.setItem("userType", user.user_type);
      localStorage.setItem("email", user.email);
      
      // Save full user object (optional, for getProfile/other components)
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  // ✅ Centralized Logout Logic
  async logout() {
    const refreshToken = this.getRefreshToken();

    // 1. Attempt to call backend logout endpoint (needed to blacklist token)
    if (refreshToken) {
      try {
        await axios.post(`${this.baseURL}/lms/logout/`, { // Corresponds to topbar.jsx logout URL
          refresh_token: refreshToken,
        });
      } catch (error) {
        // Logging the failure but continuing cleanup/redirect, matching original logic
        console.warn("Backend logout failed (token might be invalid or expired):", error);
      }
    }

    // 2. Clear frontend session (matching all keys set in login.jsx and setSession)
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    localStorage.removeItem("email");

    // 3. Redirect to login page
    window.location.href = '/';
  }

  // -------------------------
  //     AXIOS INTERCEPTORS
  // -------------------------
  setupInterceptors() {
    // Attach access token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Refresh token automatically
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();

            const res = await axios.post(`${this.baseURL}/lms/token/refresh/`, {
              refresh: refreshToken, 
            });

            const newAccess = res.data.access;

            localStorage.setItem(this.tokenKey, newAccess);

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return this.api(originalRequest);
          } catch (err) {
            this.logout();
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // -------------------------
  //     API METHODS
  // -------------------------
  async login(credentials) {
    const res = await this.api.post("/lms/login/", credentials);

    this.setSession(
      res.data.access,
      res.data.refresh,
      {
        user_id: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
        user_type: res.data.user_type,
      }
    );

    return res.data;
  }

  async register(data) {
    const res = await this.api.post("/lms/register", data);
    return res.data;
  }

  async getProfile() {
    const res = await this.api.get("/lms/profile");
    return res.data;
  }

  getCurrentUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }
}

export default new AuthService();