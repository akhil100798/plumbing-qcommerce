const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'http://localhost:8081';
const EDGE_URL =
  process.env.EXPO_PUBLIC_EDGE_URL ||
  process.env.EXPO_PUBLIC_EDGE_SERVER_URL ||
  '';
const DEFAULT_LOCAL_EDGE_URL = 'http://localhost:3000';

const isLocalHost = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  hostname === '10.0.2.2' ||
  hostname.endsWith('.local') ||
  /^192\.168\./.test(hostname) ||
  /^10\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const isLocalUrl = (urlString: string) => {
  try {
    return isLocalHost(new URL(urlString).hostname);
  } catch {
    return false;
  }
};

const isLocalDevelopmentApi = () => isLocalUrl(BACKEND_URL);

export const canUseDevMockFallbacks = () => false;

export const warnUsingDevMockFallback = (feature: string, error: unknown) => {
  if (canUseDevMockFallbacks()) {
    console.warn(`${feature}: using dev-only mock fallback`, error);
  }
};

export const createBackendUnavailableError = (feature: string, error?: unknown) => {
  const message =
    error instanceof Error && error.message
      ? error.message
      : `Unable to load ${feature} from the backend.`;

  return new Error(message);
};

export const createUnavailableFeatureError = (message: string) => new Error(message);

export const isRenderStagingBackend = () => BACKEND_URL.includes('plumbing-qcommerce.onrender.com');

export const getConfiguredEdgeUrl = () => {
  if (EDGE_URL && (!isLocalUrl(EDGE_URL) || canUseDevMockFallbacks())) {
    return EDGE_URL;
  }

  if (canUseDevMockFallbacks()) {
    return DEFAULT_LOCAL_EDGE_URL;
  }

  return null;
};

export const isEdgeFeatureAvailable = () => getConfiguredEdgeUrl() !== null;

