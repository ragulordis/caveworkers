import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("QA procedure authorization", () => {
  it("rejects unauthenticated attempts to create a QA plan", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.qa.createPlan({ title: "Authentication plan", featureDescription: "Validate the sign-in flow.", riskLevel: "high", testTypes: ["api"] })).rejects.toThrow();
  });
});
