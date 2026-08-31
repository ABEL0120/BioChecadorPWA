import axios from "axios";
import { timeService } from "../services/timeService";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.headers && response.headers.date) {
      timeService.setOffsetFromHeader(response.headers.date);
    }
    return response;
  },
  (error) => {
    if (error.response?.headers?.date) {
      timeService.setOffsetFromHeader(error.response.headers.date);
    }
    return Promise.reject(error);
  }
);
