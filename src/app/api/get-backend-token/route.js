import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the NextAuth session token from the request
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a short-lived JWT for the backend
    const backendToken = jwt.sign(
      { email: session.email }, // Payload: include user info
      process.env.BACKEND_SECRET, // Secret key shared with backend
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    return NextResponse.json({ token: backendToken }, { status: 200 });
  } catch (error) {
    console.error('Error generating backend token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}