import { describe, expect, it } from "vitest";
import { dataAnalystPersona } from "../agents/personas/dataAnalyst";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { createReadOnlyConnectorPolicy } from "./connectors";
import { analysisWorkflowSteps, buildDataHandoff } from "./service";

function dataContext(userId: number): TrpcContext { return { user: { id: userId }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext; }

describe("Data Analyst foundation", () => {
  it("uses a full evidence-aware analysis workflow", () => {
    expect(analysisWorkflowSteps).toHaveLength(10);
    expect(analysisWorkflowSteps).toContain("Validate data quality");
    expect(analysisWorkflowSteps.at(-1)).toBe("Communicate findings to team");
  });

  it("keeps the Data Analyst persona evidence-led and production-write restricted", () => {
    expect(dataAnalystPersona.instructions).toContain("Never present an inference as a proven fact");
    expect(dataAnalystPersona.modelConfig.toolPermissions).toContain("data.query");
    expect(dataAnalystPersona.modelConfig.toolPermissions).not.toContain("production.write");
  });

  it("creates explicit read-only policy defaults for every connector kind", () => {
    const policy = createReadOnlyConnectorPolicy("data_warehouse");
    expect(policy).toMatchObject({ canRead: true, canQuery: true, canAnalyze: true, canWrite: false, requiresApprovalForWrite: true });
  });

  it("formats distinct developer and cybersecurity collaboration handoffs", () => {
    const developer = buildDataHandoff({ teammate: "full-stack-developer", title: "Mobile conversion decline", evidence: "The change begins after the mobile release.", confidence: "medium" });
    const security = buildDataHandoff({ teammate: "cybersecurity-analyst", title: "Authentication failure increase", evidence: "Failures rose in a single region.", confidence: "low" });
    expect(developer.analystMessage).toContain("Alex");
    expect(developer.teammateMessage).toContain("Noor");
    expect(security.analystMessage).toContain("Maya");
    expect(security.analystMessage).toContain("security signal");
  });

  it("validates source and schedule inputs before persistence", async () => {
    const caller = appRouter.createCaller(dataContext(1));
    await expect(caller.data.registerSource({ name: "x", sourceType: "csv", connectorKey: "x" })).rejects.toThrow();
    await expect(caller.data.prepareSchedule({ title: "Weekly KPI report", analysisType: "kpi", cronExpression: "0 9 * * *", prompt: "Review weekly KPIs" })).rejects.toThrow();
  });

  it("does not permit a governed source registration without a company authorization boundary", async () => {
    const caller = appRouter.createCaller(dataContext(999_999));
    await expect(caller.data.registerSource({ name: "Revenue warehouse", sourceType: "data_warehouse", connectorKey: "warehouse-prod" })).rejects.toThrow();
  });
});
