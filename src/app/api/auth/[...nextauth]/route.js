import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    access_type: 'offline', // Ensure refresh token is requested
                },
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },

    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },

    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            },
        },
    },

    secret: process.env.NEXTAUTH_SECRET,

    callbacks: {
        async jwt({ token, account, user }) {
            // Store Google ID token and user info on initial login
            if (account && user) {
                token.idToken = account.id_token; // Store Google ID token
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
            }
            return token;
        },

        async session({ session, token }) {
            // Pass Google ID token and user info to session
            session.user.idToken = token.idToken;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.image = token.picture;
            return session;
        },

        async redirect({ baseUrl }) {
            return `${baseUrl}/forms`;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };