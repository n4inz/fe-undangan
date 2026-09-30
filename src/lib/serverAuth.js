import 'server-only';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canAccessStaffPanel, dashboardFor } from './roles';

const readAccount = async (headers) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth`, {
            headers,
            cache: 'no-store',
        });
        return response.ok ? response.json() : null;
    } catch {
        return null;
    }
};

export const getCurrentAccount = async (preferStaffCookie = false) => {
    const session = await getServerSession(authOptions);
    const cookieToken = cookies().get('client_token')?.value;
    const fromCookie = async () => {
        if (!cookieToken) return null;
        const user = await readAccount({ Cookie: `token=${cookieToken}` });
        return user ? { user } : null;
    };

    if (preferStaffCookie) {
        const account = await fromCookie();
        if (account) return account;
    }
    if (session?.user?.sessionToken) {
        const user = await readAccount({ Authorization: `Bearer ${session.user.sessionToken}` });
        if (user) return { ...session, user: { ...session.user, ...user } };
    }
    return fromCookie();
};

export const requireCustomerRole = async (role) => {
    const session = await getCurrentAccount();
    if (!session) redirect('/?error=SessionExpired');
    if (session.user.role !== role) redirect(dashboardFor(session.user));
    return session;
};

export const requireStaffAccount = async () => {
    const session = await getCurrentAccount(true);
    if (!session) redirect('/login');
    if (!canAccessStaffPanel(session.user)) redirect(dashboardFor(session.user));
    return session;
};
