import axios, { AxiosInstance } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export interface ApiUser {
  id: string;
  username: string;
}

export interface WebsiteTick {
  id: string;
  response_time_ms: number;
  status: "Up" | "Down" | "Unknown";
  region_id?: string;
  website_id: string;
  createdAt: string;
}

export interface Website {
  id: string;
  url: string;
  userId: string;
  timeAdded: string;
  ticks?: WebsiteTick[];
}

export interface SignupResponse {
  user_id: string;
  username: string;
}

export interface SigninResponse {
  jwt: string;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("upgrid_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  // Authentication
  signup: async (username: string, password: string): Promise<SignupResponse> => {
    const res = await apiClient.post<SignupResponse>("/user/signup", {
      username,
      password,
    });
    return res.data;
  },

  signin: async (username: string, password: string): Promise<SigninResponse> => {
    const res = await apiClient.post<SigninResponse>("/user/signin", {
      username,
      password,
    });
    return res.data;
  },

  // Websites
  createWebsite: async (url: string): Promise<Website> => {
    const res = await apiClient.post<Website>("/website", { url });
    return res.data;
  },

  getWebsites: async (): Promise<Website[]> => {
    const res = await apiClient.get<Website[]>("/websites");
    return res.data;
  },

  getWebsiteById: async (websiteId: string): Promise<Website> => {
    const res = await apiClient.get<Website>(`/status/${websiteId}`);
    return res.data;
  },
};

export default apiClient;
