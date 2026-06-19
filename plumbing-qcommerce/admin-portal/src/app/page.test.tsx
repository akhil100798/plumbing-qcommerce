import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AnalyticsDashboard from "./analytics/page";
import StoreManagerDashboard from "./page";

describe("admin portal pages", () => {
  it("renders the store manager dashboard shell", () => {
    const html = renderToString(<StoreManagerDashboard />);

    expect(html).toContain("PlumbCommerce");
    expect(html).toContain("Store Manager");
    expect(html).toContain("Live Active Jobs");
  });

  it("renders the analytics dashboard shell", () => {
    const html = renderToString(<AnalyticsDashboard />);

    expect(html).toContain("Global Admin");
    expect(html).toContain("Platform Analytics");
    expect(html).toContain("Total Revenue");
  });
});
