import axios, { AxiosInstance } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export interface ApiUser {
  id: string;
  username: string;
}

export interface Region {
  id: string;
  name: string;
  code?: string;
  location?: string;
}

export interface WebsiteTick {
  id: string;
  response_time_ms: number;
  status: "Up" | "Down" | "Unknown";
  region_id?: string;
  website_id: string;
  createdAt: string;
  region?: Region;
}

export interface Website {
  id: string;
  url: string;
  userId: string;
  timeAdded: string;
  interval?: number;
  lastProbedAt?: string | null;
  regions?: Region[];
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

  // Regions
  getRegions: async (): Promise<Region[]> => {
    const res = await apiClient.get<Region[]>("/regions");
    return res.data;
  },

  // Websites
  createWebsite: async (
    url: string,
    interval?: number,
    regions?: string[]
  ): Promise<Website> => {
    const res = await apiClient.post<Website>("/website", {
      url,
      ...(interval !== undefined ? { interval } : {}),
      ...(regions !== undefined ? { regions } : {}),
    });
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
