// @vitest-environment jsdom
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getJob: vi.fn(),
  listPlumbers: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "42" }) }));
vi.mock("@/services/operationsService", () => ({
  getOperationsServiceJob: mocks.getJob,
  listEligiblePlumbers: mocks.listPlumbers,
  reassignPlumber: vi.fn(),
}));

import OperationsServiceJobDetailPage from "./page";

const blockedStatuses = [
  "ARRIVED", "IN_PROGRESS", "MATERIALS_REQUIRED", "WAITING_FOR_STORE",
  "READY_FOR_PRODUCT_PICKUP", "PLUMBER_COLLECTING_PRODUCTS", "PRODUCTS_COLLECTED",
  "RETURNING_TO_CUSTOMER", "WORK_RESUMED", "COMPLETED", "CUSTOMER_CONFIRMED", "PAID", "CANCELLED",
];

function job(status: string) {
  return {
    jobId: 42, status, requestType: "NEARBY_AUTO", description: "Leak", delayFlag: false,
    customer: { id: 1, name: "Customer", phone: "1", email: "customer@test" },
    plumber: { id: 2, name: "Plumber B", phone: "2", email: "plumber@test" },
    address: { latitude: 19.1, longitude: 72.1 }, materialRequests: [], logs: [],
    createdAt: "2026-01-01T10:00:00", assignmentHistory: [
      { id: 1, plumberId: 1, plumberName: "Plumber A", status: "REASSIGNED", assignmentMode: "OPERATOR", actorId: 7, actorRole: "OPERATIONS_ADMIN", reason: "Initial assignment", createdAt: "2026-01-01T10:01:00" },
      { id: 2, plumberId: 2, plumberName: "Plumber B", status: "ASSIGNED", assignmentMode: "OPERATOR", actorId: 7, actorRole: "OPERATIONS_ADMIN", reason: "Reassignment", createdAt: "2026-01-01T10:02:00" },
    ],
  };
}

describe("operations service-job assignment controls", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it.each(["PENDING", "ACCEPTED"])("allows assignment controls for %s", async (status) => {
    mocks.getJob.mockResolvedValue(job(status));
    mocks.listPlumbers.mockResolvedValue([{ id: 3, name: "Eligible", phone: "3" }]);
    render(<OperationsServiceJobDetailPage />);
    expect(await screen.findByRole("button", { name: "Assign / Reassign" })).toBeTruthy();
  });

  it.each(blockedStatuses)("does not invite assignment in %s", async (status) => {
    mocks.getJob.mockResolvedValue(job(status));
    mocks.listPlumbers.mockResolvedValue([]);
    render(<OperationsServiceJobDetailPage />);
    await screen.findByText(status);
    expect(screen.queryByRole("button", { name: "Assign / Reassign" })).toBeNull();
    expect(screen.getByText(/Assignment is unavailable/)).toBeTruthy();
  });

  it("renders operations audit fields and historical plumber names", async () => {
    mocks.getJob.mockResolvedValue(job("ACCEPTED"));
    mocks.listPlumbers.mockResolvedValue([]);
    render(<OperationsServiceJobDetailPage />);
    await waitFor(() => expect(screen.getByText("Plumber A")).toBeTruthy());
    expect(screen.getByText("Initial assignment")).toBeTruthy();
    expect(screen.getByText("Reassignment")).toBeTruthy();
    expect(screen.getAllByText("OPERATOR")).toHaveLength(2);
  });
});
