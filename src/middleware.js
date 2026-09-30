import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { canAccessStaffPanel, dashboardFor } from './lib/roles';

export async function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const isAdminPath = pathname.startsWith('/admin');
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token',
    });
    const cookieToken = request.cookies.get('client_token')?.value;
    const customerHeaders = token?.sessionToken
        ? { Authorization: 'Bearer ' + token.sessionToken }
        : null;
    const staffHeaders = cookieToken ? { Cookie: 'token=' + cookieToken } : null;
    const credentials = isAdminPath ? [staffHeaders, customerHeaders] : [customerHeaders, staffHeaders];

    let user = null;
    for (const headers of credentials.filter(Boolean)) {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth', {
                headers,
                cache: 'no-store',
            });
            if (response.ok) {
                user = await response.json();
                break;
            }
        } catch {
            // Fail closed if the API cannot validate the current account.
        }
    }

    if (!user) {
        return NextResponse.redirect(new URL(isAdminPath ? '/login' : '/?error=SessionExpired', request.url));
    }
    const home = dashboardFor(user);
    if ((isAdminPath && !canAccessStaffPanel(user)) ||
        (pathname.startsWith('/reseller') && user.role !== 'reseller') ||
        (pathname === '/forms' && home !== '/forms')) {
        return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/reseller/:path*', '/forms'],
};
