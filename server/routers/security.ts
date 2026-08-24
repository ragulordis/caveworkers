import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createSecurityFindingForUser, createSecurityReviewForUser, getRelevantSecurityContextForUser, getSecurityDashboardForUser, handoffFindingToDeveloperForUser, requestSecurityOperationForUser, verifySecurityRemediationForUser } from "../security/service";

const reviewType = z.enum(["security_assessment", "threat_model", "code_review", "api_review", "authentication_review", "authorization_review", "dependency_review", "infrastructure_review", "configuration_review", "incident_analysis", "verification"]);
const severity = z.enum(["critical", "high", "medium", "low", "informational"]);
const confidence = z.enum(["confirmed", "likely", "potential", "insufficient_evidence"]);

export const securityRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => getSecurityDashboardForUser(ctx.user.id)),
  context: protectedProcedure.query(({ ctx }) => getRelevantSecurityContextForUser(ctx.user.id)),
  createReview: protectedProcedure.input(z.object({ title: z.string().trim().min(3).max(255), reviewType, description: z.string().trim().max(6_000).optional() })).mutation(({ ctx, input }) => createSecurityReviewForUser(ctx.user.id, input)),
  createFinding: protectedProcedure.input(z.object({ reviewId: z.number().int().positive(), severity, confidence, title: z.string().trim().min(3).max(255), description: z.string().trim().min(3).max(10_000), impact: z.string().trim().min(3).max(4_000), likelihood: z.string().trim().min(2).max(80), evidence: z.string().trim().min(3).max(10_000), recommendation: z.string().trim().min(3).max(10_000), requiresApproval: z.boolean().optional() })).mutation(({ ctx, input }) => createSecurityFindingForUser(ctx.user.id, input)),
  handoffFinding: protectedProcedure.input(z.object({ findingId: z.number().int().positive() })).mutation(({ ctx, input }) => handoffFindingToDeveloperForUser(ctx.user.id, input)),
  verifyRemediation: protectedProcedure.input(z.object({ findingId: z.number().int().positive(), verificationSummary: z.string().trim().min(3).max(10_000) })).mutation(({ ctx, input }) => verifySecurityRemediationForUser(ctx.user.id, input)),
  requestSensitiveOperation: protectedProcedure.input(z.object({ toolName: z.string().trim().min(2).max(100), operation: z.string().trim().min(3).max(120), reason: z.string().trim().min(3).max(4_000) })).mutation(({ ctx, input }) => requestSecurityOperationForUser(ctx.user.id, input)),
});
