import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from 'axios';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/login-customer`,
          {},
          {
            headers: {
              Authorization: `Bearer ${account.id_token}`,
            },
            validateStatus: () => true,
          }
        );

        console.log('SignIn Callback - Backend Response:', {
          status: response.status,
          data: response.data,
        });

        if (response.status !== 200 || !response.data.sessionToken || !response.data.user) {
          console.error('SignIn Callback - Invalid response:', response.data);
          return false;
        }

        user.sessionToken = response.data.sessionToken;
        user.email = response.data.user.email;
        user.name = response.data.user.name;
        user.image = response.data.user.avatar;
        return true;
      } catch (error) {
        console.error('SignIn Callback - Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.sessionToken = user.sessionToken;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      // console.log('JWT Callback - Token:', {
      //   sessionToken: token.sessionToken,
      //   email: token.email,
      // });
      return token;
    },

    async session({ session, token }) {
      session.user.sessionToken = token.sessionToken;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      // console.log('Session Callback - Session:', {
      //   sessionToken: session.user.sessionToken,
      //   email: session.user.email,
      // });
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/forms`;
    },
  },

  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };