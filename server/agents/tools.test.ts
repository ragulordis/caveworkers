import { describe, expect, it } from "vitest";
import { formatAllowedEmployeeTools, getAllowedEmployeeTools } from "./tools";

describe("employee tool registry", () => {
  it("keeps Alex limited to explicitly granted engineering tools", () => {
    const tools = getAllowedEmployeeTools("full-stack-developer", ["repository.read", "memory.read"]);
    expect(tools.map((tool) => tool.permission)).toEqual(["repository.read", "memory.read"]);
    expect(tools.some((tool) => tool.permission === "test.run")).toBe(false);
  });

  it("keeps each employee’s capability surface distinct", () => {
    expect(formatAllowedEmployeeTools("cybersecurity-analyst", ["security.scan"])).toContain("Security scanner");
    expect(formatAllowedEmployeeTools("data-analyst", ["data.query"])).toContain("Data query");
    expect(formatAllowedEmployeeTools("qa-automation-engineer", ["test.run"])).toContain("Test runner");
    expect(formatAllowedEmployeeTools("qa-automation-engineer", ["security.scan"])).toBe("none");
  });
});
