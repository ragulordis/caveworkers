import { describe, expect, it } from "vitest";
import { qaEngineerPersona } from "../agents/personas/qaEngineer";
import { classifyQaFailure, testToolRegistry } from "./adapters";

describe("QA Automation Engineer foundations", () => {
  it("keeps sensitive QA operations explicitly approval-gated", () => {
    expect(qaEngineerPersona.instructions).toContain("production testing");
    expect(qaEngineerPersona.modelConfig.toolPermissions).toContain("test.run");
    expect(qaEngineerPersona.modelConfig.toolPermissions).not.toContain("production.write");
    expect(testToolRegistry.find((tool) => tool.key === "load-test")?.requiresApproval).toBe(true);
  });
  it("classifies failures without treating every test failure as an application bug", () => {
    expect(classifyQaFailure({ applicationEvidence: true })).toBe("application_bug");
    expect(classifyQaFailure({ testBroken: true })).toBe("broken_test");
    expect(classifyQaFailure({ environmentUnavailable: true })).toBe("environment_failure");
    expect(classifyQaFailure({ intermittent: true })).toBe("flaky_test");
  });
});
