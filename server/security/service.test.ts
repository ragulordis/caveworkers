import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDemoWorkspace } from "../workspace/demo";
import { cybersecurityAnalystPersona } from "../agents/personas/cybersecurityAnalyst";
import { buildDeveloperHandoff, securityReviewSteps } from "./service";

function securityContext(userId: number): TrpcContext {
  return { user: { id: userId }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

describe("Cybersecurity Analyst workflow", () => {
  it("uses a structured review process that includes developer coordination and verification", () => {
    expect(securityReviewSteps).toHaveLength(12);
    expect(securityReviewSteps).toContain("Coordinate with developer");
    expect(securityReviewSteps.at(-1)).toBe("Verify remediation");
  });

  it("publishes the Cybersecurity Analyst through the shared team-room message contract", () => {
    const message = getDemoWorkspace().messages.find((item) => item.employeeKey === "cybersecurity-analyst");
    expect(message).toMatchObject({ sender: "employee", employeeName: "Maya", messageType: "task_assignment" });
  });

  it("uses an evidence-led persona with explicit restricted permissions", () => {
    expect(cybersecurityAnalystPersona.instructions).toContain("Do not invent vulnerabilities");
    expect(cybersecurityAnalystPersona.modelConfig.toolPermissions).toContain("security.scan");
    expect(cybersecurityAnalystPersona.modelConfig.toolPermissions).not.toContain("production.write");
  });

  it("builds a persistent two-way Maya-to-Alex remediation handoff", () => {
    const handoff = buildDeveloperHandoff({ findingTitle: "Missing authorization boundary", severity: "high", recommendation: "Add resource ownership checks." });
    expect(handoff.analystMessage).toContain("Alex");
    expect(handoff.analystMessage).toContain("Missing authorization boundary");
    expect(handoff.developerMessage).toContain("Maya for verification");
  });

  it("rejects incomplete security-review requests before persistence", async () => {
    const caller = appRouter.createCaller(securityContext(1));
    await expect(caller.security.createReview({ title: "x", reviewType: "api_review" })).rejects.toThrow();
    await expect(caller.security.createFinding({ reviewId: 0, severity: "high", confidence: "confirmed", title: "x", description: "x", impact: "x", likelihood: "x", evidence: "x", recommendation: "x" })).rejects.toThrow();
  });

  it("does not authorize a sensitive operation without a company security boundary", async () => {
    const caller = appRouter.createCaller(securityContext(999_999));
    await expect(caller.security.requestSensitiveOperation({ toolName: "production", operation: "rotate credential", reason: "Security verification request" })).rejects.toThrow();
  });

  it("requires an authorized finding before remediation verification or handoff is persisted", async () => {
    const caller = appRouter.createCaller(securityContext(999_999));
    await expect(caller.security.verifyRemediation({ findingId: 1, verificationSummary: "Verified the authorization check with a tenant-bound regression case." })).rejects.toThrow();
    await expect(caller.security.handoffFinding({ findingId: 1 })).rejects.toThrow();
  });
});
