import axios from "axios";
import { withInterceptors } from "./interceptors";
import { getEnv } from "../utils/env";

/** Axios klient s baseURL; TODO: doplnit timeout, headers */
export const api = withInterceptors(
  axios.create({
    baseURL: getEnv("VITE_API_BASE_URL"),
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  })
);
