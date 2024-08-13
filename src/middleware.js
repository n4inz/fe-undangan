import { NextResponse, NextRequest } from 'next/server';
// import { isAuthenticated } from '@/lib/auth';

export async function middleware(request) {

    const token = request.cookies.get('token')?.value; // Retrieve the token from cookies
    const response = await (await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth", { 
        credentials: 'include', 
        headers: { 'Cookie': `token=${token}` } // Send the token as a cookie header
    })).json();
    if(response.email) {
        return NextResponse.next()
        // return NextResponse.json([response, token])
    }else{
        return NextResponse.redirect(new URL('/login', request.url))
    }
    
}

export const config = {
    matcher: '/admin/:path*', // Adjust the path as needed
};