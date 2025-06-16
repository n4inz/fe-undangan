import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Add this line

export async function GET(request) {
  try {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const backendToken = jwt.sign(
      { email: session.email },
      process.env.BACKEND_SECRET,
      { expiresIn: '1h' }
    );
    return NextResponse.json({ token: backendToken }, { status: 200 });
  } catch (error) {
    console.error('Error generating backend token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}