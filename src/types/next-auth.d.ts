import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      tokens: number
      accountType: string
      planExpiresAt?: Date | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    tokens?: number
    accountType?: string
    planExpiresAt?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
} 