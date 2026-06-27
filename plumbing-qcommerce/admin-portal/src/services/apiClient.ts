const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081";
const TOKEN_KEY = "pqc_admin_token";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getBackendUrl() {
  return BACKEND_URL;
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  responseType?: "json" | "text";
  token?: string;
};

async function readErrorPayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const authEnabled = options.auth !== false;
  const token = options.token ?? (authEnabled ? getStoredToken() : "");

  if (authEnabled && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body =
    options.body == null || options.body instanceof FormData || typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body);

  if (body && !headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    const message =
      (payload as { message?: string; error?: string } | null)?.message ||
      (payload as { message?: string; error?: string } | null)?.error ||
      response.statusText ||
      "Request failed";
    throw new ApiError(message, response.status, payload);
  }

  if (options.responseType === "text") {
    return (await response.text()) as T;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}
