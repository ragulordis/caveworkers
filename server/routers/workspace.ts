import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { appendMessageForUser, createCompanyWorkspace, createTaskForUser, updateTaskForUser } from "../db";
import { getWorkspaceOverviewForUser } from "../workspace/service";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const createCompanyInput = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4_000).optional(),
  industry: z.string().trim().max(120).optional(),
  goals: z.string().trim().max(4_000).optional(),
  teamContext: z.string().trim().max(4_000).optional(),
  technologyStack: z.array(z.string().trim().min(1).max(100)).max(40).default([]),
});

const taskStatus = z.enum(["backlog", "planning", "in_progress", "waiting", "review", "completed", "blocked"]);

export async function requireWorkspaceForMutation<T>(operation: () => Promise<T>) {
  try { return await operation(); } catch (error) { if (error instanceof Error && error.message === "No company workspace is available for this user") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete company setup before assigning work. Your onboarding form is ready to create the workspace." }); throw error; }
}

/** Product-layer contracts. Persistence services can be swapped in without changing consumers. */
export const workspaceRouter = router({
  overview: publicProcedure.query(({ ctx }) => getWorkspaceOverviewForUser(ctx.user?.id)),
  createCompany: protectedProcedure.input(createCompanyInput).mutation(async ({ input, ctx }) => {
    const workspace = await createCompanyWorkspace(ctx.user.id, input);
    return { workspace, persistence: "saved" as const };
  }),
  createTask: protectedProcedure.input(z.object({ title: z.string().trim().min(3).max(255), description: z.string().trim().max(6_000).optional() })).mutation(async ({ input, ctx }) => ({ task: await requireWorkspaceForMutation(() => createTaskForUser(ctx.user.id, input)) })),
  updateTaskStatus: protectedProcedure.input(z.object({ taskId: z.number().int().positive(), status: taskStatus, progress: z.number().int().min(0).max(100).optional() })).mutation(async ({ input, ctx }) => ({ task: await requireWorkspaceForMutation(() => updateTaskForUser(ctx.user.id, input)) })),
  appendMessage: protectedProcedure.input(z.object({ content: z.string().trim().min(1).max(10_000), relatedTaskId: z.number().int().positive().optional() })).mutation(async ({ input, ctx }) => ({ message: await requireWorkspaceForMutation(() => appendMessageForUser(ctx.user.id, input)) })),
});
