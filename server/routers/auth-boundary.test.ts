import { describe, expect, it } from "vitest";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";

const unauthenticatedContext = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;

describe("authenticated tenant route boundary", () => {
  it("rejects unauthenticated reads for the workspace and every workforce dashboard", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext);
    await expect(caller.workspace.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.security.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.data.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.qa.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
