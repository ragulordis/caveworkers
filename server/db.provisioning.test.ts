import { describe, expect, it } from "vitest";
import { createTaskWithDependencies, ensureCompanyForUserWithDependencies, getCreatedRecordId, provisionWhenMissing } from "./db";

describe("automatic initial workspace provisioning", () => {
  it("resolves valid created-record identifiers across MySQL insert-result shapes", () => {
    expect(getCreatedRecordId({ insertId: 12 })).toBe(12);
    expect(getCreatedRecordId([{ insertId: 13n }])).toBe(13);
    expect(getCreatedRecordId({})).toBeUndefined();
  });

  it("creates exactly one first workspace when an authenticated user has no membership", async () => {
    let workspace: { id: number; name: string } | undefined;
    let creates = 0;
    const result = await provisionWhenMissing(async () => workspace, async () => { creates += 1; workspace = { id: 42, name: "First User's workspace" }; });
    expect(result).toEqual({ id: 42, name: "First User's workspace" });
    expect(creates).toBe(1);
  });

  it("does not create a second workspace for a user who already has membership", async () => {
    let creates = 0;
    const result = await provisionWhenMissing(async () => ({ id: 7, name: "Existing workspace" }), async () => { creates += 1; });
    expect(result).toEqual({ id: 7, name: "Existing workspace" });
    expect(creates).toBe(0);
  });

  it("provisions a first company inside the first authenticated task mutation", async () => {
    let company: { id: number; name: string } | undefined;
    const createdInputs: Array<{ name: string }> = [];
    const task = await createTaskWithDependencies(1, { title: "First task" }, { company: () => ensureCompanyForUserWithDependencies({ findExisting: async () => company, ownerName: async () => "First User", createWorkspace: async (input) => { createdInputs.push(input); company = { id: 88, name: input.name }; } }), employee: async () => ({ id: 3 }), insertTask: async (value) => { expect(value.companyId).toBe(88); return 101; }, insertActivity: async (value) => { expect(value.taskId).toBe(101); } });
    expect(createdInputs).toEqual([{ name: "First User's workspace", description: "Initial private workspace", technologyStack: [] }]);
    expect(task).toMatchObject({ id: 101, title: "First task", status: "planning" });
  });
});
