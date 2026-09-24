import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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
import { getBackendUrl } from "../services/apiClient";

describe("admin portal pages", () => {
  it("renders the login loading shell on the home page", () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain("Checking portal access");
  });

  it("redirects analytics to the dashboard", () => {
    expect(AnalyticsPage()).toBeUndefined();
  });

  it("targets the canonical production backend URL by default", () => {
    expect(getBackendUrl()).toBe("https://plumbing-qcommerce.onrender.com");
    expect(getBackendUrl()).not.toContain("localhost:8081");
    expect(getBackendUrl()).not.toContain("fixkart-dev2-backend.onrender.com");
  });
});
