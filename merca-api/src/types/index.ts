export interface User {
  id: string
  email: string
  password: string
  name: string | null
  created_at: Date
}

export interface File {
  id: string
  filename: string
  url: string
  user_id: string
  created_at: Date
}

export interface JwtPayload {
  userId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
