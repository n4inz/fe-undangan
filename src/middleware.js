import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Check if the request is for /admin and there is no auth cookie
    if (pathname.startsWith('/admin') && !request.cookies.get('token')) {
        // Explicitly set the method to 'GET' when redirecting to avoid 307 errors
        const url = new URL('/login', request.url);
        return NextResponse.redirect(url, 307); // Use 307 explicitly if method consistency is required
    }

    console.log(request.cookies.get('token'));

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*', // Adjust as needed for matching admin paths
};
