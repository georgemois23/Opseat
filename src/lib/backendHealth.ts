import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ?? "";

const HEALTH_PATHS = ["/health"];

export async function isBackendHealthy(): Promise<boolean> {
  const targets = HEALTH_PATHS.map((path) => `${API_BASE}${path}`);
  for (const url of targets) {
    try {
      const res = await axios.get(url, {
        timeout: 8000,
        withCredentials: false,
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) return true;
    } catch {
      // try next candidate
    }
  }
  return false;
}

