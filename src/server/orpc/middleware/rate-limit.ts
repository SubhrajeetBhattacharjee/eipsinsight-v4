import { os, ORPCError } from "@orpc/server";
import type { Ctx } from "./types";
import { enforceRateLimit, buildRateLimitHeaders } from "@/lib/rate-limit";

export type RateLimitedContext = Ctx & {
  rateLimitHeaders: Record<string, string>;
};

export const withRateLimit = os.middleware<Ctx, RateLimitedContext>(
  async ({ context, next }) => {
    const result = await enforceRateLimit({
      userId: context.user?.id,
      apiTokenId: context.apiToken?.id,
    });

    const rateLimitHeaders = buildRateLimitHeaders(result);

    if (!result.allowed) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "Rate limit exceeded",
        metadata: {
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
        },
      });
    }

    return next({
      context: {
        ...context,
        rateLimitHeaders,
      },
    });
  }
);
