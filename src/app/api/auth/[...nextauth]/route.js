import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari dalam detik
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 hari dalam detik
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, account }) {
      // Saat login pertama kali, simpan id_token (jika ada)
      if (account?.id_token) {
        token.accessToken = account.id_token;
      }

      // Simpan informasi tambahan jika dibutuhkan
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      return session;
    },

    async redirect({ baseUrl }) {
      return "/forms";
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
