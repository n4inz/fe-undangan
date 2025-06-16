import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline", // Ensure refresh token is requested
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
        sameSite: "none", // Changed from 'lax' to allow cross-site requests
        path: "/",
        secure: true, // Required for sameSite: 'none' and production
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.idToken = token.idToken;
      session.user.refreshToken = token.refreshToken;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/forms`;
    },
  },

  debug: true, // Enable debug logs to diagnose issues
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };