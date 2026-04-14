// DEV: middleware temporarily disabled — passes all requests through.
// TODO: restore full auth middleware before production.
import { type NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
