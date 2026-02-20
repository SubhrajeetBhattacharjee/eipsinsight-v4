import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit, buildRateLimitHeaders } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiOrRpc = pathname.startsWith('/api/') || pathname.startsWith('/rpc/');
  if (!isApiOrRpc) return NextResponse.next();

  const exemptPaths = [
    '/api/auth/',
    '/api/validate-eip',
    '/api/analytics/revalidate',
    '/api/rpc/',  // 👈 exempt RPC — procedures handle their own auth
  ];
  const isExempt = exemptPaths.some(path => pathname.startsWith(path));
  if (isExempt) return NextResponse.next();

  try {
    // Convert headers to plain object, filtering out undefined values
    const headerObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (value) {
        headerObj[key] = value;
      }
    });

    let userId: string | null = null;

    // Session-based auth only in middleware (RPC handles API tokens)
    try {
      const session = await auth.api.getSession({ headers: headerObj });
      if (session?.user) {
        userId = session.user.id;
      }
    } catch {
      // continue
    }

    if (userId) {
      const result = await enforceRateLimit({ userId });
      const rateLimitHeaders = buildRateLimitHeaders(result);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded',
            metadata: {
              limit: result.limit,
              remaining: result.remaining,
              resetAt: result.resetAt,
            },
          },
          { status: 429, headers: new Headers(rateLimitHeaders) }
        );
      }

      const response = NextResponse.next();
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/api/:path*', '/rpc/:path*'],
};