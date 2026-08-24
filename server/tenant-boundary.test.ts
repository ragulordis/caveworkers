import { describe, expect, it } from "vitest";
import { requireTenantRecord } from "./db";

describe("company tenant boundary", () => {
  it("returns a record only when its company matches the authenticated user tenant", () => {
    expect(requireTenantRecord({ id: 4, companyId: 81, title: "Private plan" }, 81, "Task")).toMatchObject({ id: 4, companyId: 81 });
  });

  it("rejects a guessed record identifier from another company tenant", () => {
    expect(() => requireTenantRecord({ id: 4, companyId: 81 }, 99, "Company document")).toThrow("not found in this company workspace");
    expect(() => requireTenantRecord(undefined, 99, "Activity event")).toThrow("not found in this company workspace");
  });
});
