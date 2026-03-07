import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import LinkedIn from "next-auth/providers/linkedin"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, GitHub, LinkedIn],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const protectedPaths = ["/dashboard", "/mail", "/invest"]
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (isProtected && !isLoggedIn) {
        return false
      }
      return true
    },
    jwt({ token, user, account }) {
      if (user?.id) token.id = user.id
      // Persist the GitHub access token for star checking
      if (account?.provider === "github" && account.access_token) {
        token.githubAccessToken = account.access_token
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      // Pass GitHub access token to session for star verification API
      if (token.githubAccessToken) {
        ;(session as any).accessToken = token.githubAccessToken
      }
      return session
    },
  },
})
