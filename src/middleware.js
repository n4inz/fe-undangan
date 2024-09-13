import { NextResponse } from 'next/server';

export async function middleware(request) {
    try {
        const token = request.cookies.get('token')?.value; // Retrieve the token from cookies
        
        // Redirect to login if the token is missing
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Call the authentication API to validate the token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth`, {
            credentials: 'include',
            headers: {
                'Cookie': `token=${token}`,
            },
        });

        // If the API returns an error or invalid response, handle it
        if (!response.ok) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const data = await response.json();

        // Check if the user is authenticated
        if (data.email) {
            return NextResponse.next(); // Allow the request to proceed
        } else {
            return NextResponse.redirect(new URL('/login', request.url)); // Redirect to login if no email is found
        }
    } catch (error) {
        // In case of an error, redirect to login (e.g., network issues or API failure)
        console.error('Error in middleware:', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: '/admin/:path*', // Match all admin routes
};
