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

describe("admin portal pages", () => {
  it("renders the login loading shell on the home page", () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain("Checking portal access");
  });

  it("redirects analytics to the dashboard", () => {
    expect(AnalyticsPage()).toBeUndefined();
  });
});
