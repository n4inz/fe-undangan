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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
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

        if (response.status !== 200 || !response.data.sessionToken || !response.data.user) {
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
      return token;
    },

    async session({ session, token }) {
      session.user.sessionToken = token.sessionToken;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // jika tidak ada url, fallback ke /forms
      if (!url) return `${baseUrl}/forms`;

      try {
        // resolve url relatif terhadap baseUrl (menjaga query/value termasuk "?=contoh")
        const resolved = new URL(url, baseUrl);
        // pastikan origin sama (untuk keamanan)
        const baseOrigin = new URL(baseUrl).origin;
        if (resolved.origin === baseOrigin) {
          return resolved.toString(); // kembalikan full URL termasuk query
        } else {
          // jangan izinkan cross-origin redirect
          return `${baseUrl}/forms`;
        }
      } catch (err) {
        // jika url tidak valid, fallback
        return `${baseUrl}/forms`;
      }
    },
  },

  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
