import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET);
    console.log('GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    console.log('Session:', session);
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const backendToken = jwt.sign(
      { email: session.email },
      process.env.BACKEND_SECRET,
      { expiresIn: '1h' }
    );
    return NextResponse.json({ token: backendToken }, { status: 200 });
  } catch (error) {
    console.error('Error generating backend token:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}