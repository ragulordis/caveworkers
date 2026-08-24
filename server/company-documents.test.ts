import { describe, expect, it } from "vitest";
import { MAX_COMPANY_DOCUMENT_BYTES, validateCompanyDocumentUpload } from "./db";

describe("company document upload validation", () => {
  it("accepts a correctly sized CSV attachment and normalizes its filename", () => {
    const data = Buffer.from("team,headcount\nengineering,12\n");
    expect(validateCompanyDocumentUpload({ fileName: "Q3/team-plan.csv", contentType: "text/csv", sizeBytes: data.length, base64Data: data.toString("base64") })).toMatchObject({ fileName: "Q3_team-plan.csv", data });
  });

  it("rejects unsupported extensions, size overflow, and incomplete document data", () => {
    const data = Buffer.from("not executable").toString("base64");
    expect(() => validateCompanyDocumentUpload({ fileName: "install.exe", contentType: "application/octet-stream", sizeBytes: 14, base64Data: data })).toThrow("CSV, PDF, Word, Excel, text, or Markdown");
    expect(() => validateCompanyDocumentUpload({ fileName: "team.csv", contentType: "text/csv", sizeBytes: MAX_COMPANY_DOCUMENT_BYTES + 1, base64Data: data })).toThrow("10 MB");
    expect(() => validateCompanyDocumentUpload({ fileName: "team.csv", contentType: "text/csv", sizeBytes: 100, base64Data: data })).toThrow("invalid or incomplete");
  });
});
