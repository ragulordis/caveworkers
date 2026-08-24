import { describe, expect, it } from "vitest";
import { requireWorkspaceForMutation } from "./workspace";

describe("workspace onboarding recovery", () => {
  it("converts a missing-company mutation failure into an actionable setup-required response", async () => {
    await expect(requireWorkspaceForMutation(async () => { throw new Error("No company workspace is available for this user"); })).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("Complete company setup") });
  });

  it("allows first-time company setup operations to continue without a prior membership", async () => {
    const workspace = await requireWorkspaceForMutation(async () => ({ companyId: 42, membership: "owner" as const }));
    expect(workspace).toEqual({ companyId: 42, membership: "owner" });
  });
});
