import { NextResponse } from 'next/server';

export function middleware(request, event) {
    const token = request.cookies.get('token')?.value; // Retrieve the token from cookies

    // Use waitUntil to handle the token check asynchronously
    event.waitUntil(
        fetch(process.env.NEXT_PUBLIC_API_URL + "/auth", { 
            credentials: 'include', 
            headers: { 'Cookie': `token=${token}` } // Send the token as a cookie header
        })
        .then(response => response.json())
        .then(data => {
            if (!data.email) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        })
        .catch(() => {
            // Handle error and redirect to login if token verification fails
            return NextResponse.redirect(new URL('/login', request.url));
        })
    );

    // Proceed with the request for now
    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*', // Adjust the path as needed
};
