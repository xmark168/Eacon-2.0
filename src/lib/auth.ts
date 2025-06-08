import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      // Store account info for social connection tracking
      if (account) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string
        
        // Fetch user data including tokens
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokens: true }
          })
          
          if (user) {
            session.user.tokens = user.tokens
          }
        } catch (error) {
          console.error('Session fetch error:', error)
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // User exists, update their info and check social connection
            user.id = existingUser.id
            
            // Update user info with latest from Google
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
              }
            })

            // Check if Google social connection exists
            const existingConnection = await prisma.socialConnection.findFirst({
              where: {
                userId: existingUser.id,
                platform: 'GOOGLE',
                platformId: account.providerAccountId || ''
              }
            })

            if (!existingConnection) {
              // Create social connection if it doesn't exist
              await prisma.socialConnection.create({
                data: {
                  userId: existingUser.id,
                  platform: 'GOOGLE',
                  platformId: account.providerAccountId || '',
                  accessToken: account.access_token || '',
                  refreshToken: account.refresh_token || null,
                  expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                  isActive: true
                }
              })
              console.log('✅ Google social connection created for existing user')
            } else {
              // Update existing connection with fresh tokens
              await prisma.socialConnection.update({
                where: { id: existingConnection.id },
                data: {
                  accessToken: account.access_token || '',
                  refreshToken: account.refresh_token || null,
                  expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                  isActive: true
                }
              })
              console.log('✅ Google social connection updated for existing user')
            }
          } else {
            // Create new user with Google account
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                image: user.image,
                tokens: 100, // Welcome bonus for new Google users
              }
            })
            user.id = newUser.id

            // Create social connection for new user
            await prisma.socialConnection.create({
              data: {
                userId: newUser.id,
                platform: 'GOOGLE',
                platformId: account.providerAccountId || '',
                accessToken: account.access_token || '',
                refreshToken: account.refresh_token || null,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                isActive: true
              }
            })

            // Create welcome token transaction
            await prisma.tokenTransaction.create({
              data: {
                userId: newUser.id,
                amount: 100,
                type: 'EARNED',
                description: 'Welcome bonus for Google signup'
              }
            })

            console.log('✅ New user created with Google account and welcome bonus')
          }
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      return true
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
} 