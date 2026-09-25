import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  redirect: vi.fn(),
}));

import AnalyticsPage from "./analytics/page";
import HomePage from "./page";

describe("admin portal pages", () => {
  it("renders the login loading shell on the home page", () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain("Checking portal access");
  });

  it("redirects analytics to the dashboard", () => {
    expect(AnalyticsPage()).toBeUndefined();
  });

  describe("API Base URL resolution precedence", () => {
    const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    afterEach(() => {
      if (originalApiBaseUrl !== undefined) {
        process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
      } else {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      }
      if (originalBackendUrl !== undefined) {
        process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl;
      } else {
        delete process.env.NEXT_PUBLIC_BACKEND_URL;
      }
    });

    it("uses canonical production backend URL when no overrides are configured", async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_BACKEND_URL;

      vi.resetModules();
      const { getBackendUrl } = await import("../services/apiClient");
      expect(getBackendUrl()).toBe("https://plumbing-qcommerce.onrender.com");
      expect(getBackendUrl()).not.toContain("localhost:8081");
      expect(getBackendUrl()).not.toContain("fixkart-dev2-backend.onrender.com");
    });

    it("prefers NEXT_PUBLIC_API_BASE_URL when configured", async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = "https://api-override.fixkart.in";
      process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend-override.fixkart.in";

      vi.resetModules();
      const { getBackendUrl } = await import("../services/apiClient");
      expect(getBackendUrl()).toBe("https://api-override.fixkart.in");
    });

    it("falls back to NEXT_PUBLIC_BACKEND_URL as secondary override", async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend-override.fixkart.in";

      vi.resetModules();
      const { getBackendUrl } = await import("../services/apiClient");
      expect(getBackendUrl()).toBe("https://backend-override.fixkart.in");
    });
  });
});
