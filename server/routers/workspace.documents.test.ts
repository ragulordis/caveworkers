import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const repository = vi.hoisted(() => ({ upload: vi.fn(), detail: vi.fn(), download: vi.fn() }));
vi.mock("../db", () => ({
  createCompanyWorkspace: vi.fn(), appendMessageForUser: vi.fn(), createTaskForUser: vi.fn(), updateTaskForUser: vi.fn(),
  uploadCompanyDocumentForUser: repository.upload, getActivityEventDetailForUser: repository.detail, getCompanyDocumentDownloadForUser: repository.download,
}));
import { appRouter } from "../routers";

const ctx = { user: { id: 9, openId: "document-user", role: "user", name: "Document User", email: null, loginMethod: "google", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;

describe("workspace company-document and activity detail procedures", () => {
  it("passes a validated document to the authorized repository and exposes an event detail only by event ID", async () => {
    repository.upload.mockResolvedValue({ id: 71, name: "team.csv", contentType: "text/csv", sizeBytes: 8, createdAt: 1 });
    repository.detail.mockResolvedValue({ id: 99, action: "company_document_uploaded", summary: "Added company document: team.csv", status: "completed", createdAt: new Date(1) });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.workspace.uploadCompanyDocument({ fileName: "team.csv", contentType: "text/csv", sizeBytes: 8, base64Data: "YSxiCjEsMgo=" })).resolves.toMatchObject({ document: { id: 71 } });
    await expect(caller.workspace.activityEventDetail({ eventId: 99 })).resolves.toMatchObject({ id: 99, action: "company_document_uploaded" });
    expect(repository.upload).toHaveBeenCalledWith(9, expect.objectContaining({ fileName: "team.csv" }));
    expect(repository.detail).toHaveBeenCalledWith(9, 99);
  });
});
