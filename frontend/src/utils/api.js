export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3030/api";
export const SOCKET_BASE_URL =
  process.env.REACT_APP_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "");

export const apiRequest = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed with status ${response.status}.`,
    );
  }

  return data;
};