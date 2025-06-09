import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getDatabase } from './mongodb'
import { User } from 'next-auth'

// Session और JWT के लिए टाइप एक्सटेंशन
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      mobile?: string | null
      isAdmin?: boolean
    }
  }

  interface User {
    id?: string
    mobile?: string
    isAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Special handling for admin credentials
        const isAdmin = credentials.email === 'toolminesai@gmail.com'
        if (isAdmin && credentials.password === 'pm61.207') {
          return {
            id: 'admin-id',
            email: credentials.email,
            name: 'Admin User',
            image: null,
            mobile: undefined,
            isAdmin: true,
          }
        }

        try {
          const db = await getDatabase()
          const user = await db.collection('users').findOne({
            email: credentials.email
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            image: user.image || null,
            mobile: user.mobile || null, // मोबाइल फ़ील्ड को भी शामिल करें
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const db = await getDatabase()
          const existingUser = await db.collection('users').findOne({
            email: user.email
          })

          if (!existingUser) {
            await db.collection('users').insertOne({
              email: user.email,
              fullName: user.name,
              image: user.image,
              provider: 'google',
              googleId: profile?.sub,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        } catch (error) {
          console.error('Google sign in error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const db = await getDatabase()
          const user = await db.collection('users').findOne({
            email: session.user.email
          })
          
          if (user) {
            session.user.id = user._id.toString()
            session.user.name = user.fullName
            session.user.mobile = user.mobile
            session.user.isAdmin = token.isAdmin as boolean | undefined
          }
        } catch (error) {
          console.error('Session error:', error)
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/signup'
  },
  session: {
    strategy: 'jwt'
  }
}