import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { securityRouter } from "./routers/security";
import { dataRouter } from "./routers/data";
import { qaRouter } from "./routers/qa";
import { workspaceRouter } from "./routers/workspace";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: workspaceRouter,
  security: securityRouter,
  data: dataRouter,
  qa: qaRouter,
});

export type AppRouter = typeof appRouter;
