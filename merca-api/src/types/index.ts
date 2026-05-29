import { RowDataPacket } from 'mysql2'; 

export interface User extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  name: string | null;
  created_at: Date;

  first_name?: string;
  middle_name?: string;
  last_name?: string;
  business_name?: string;
  phone?: string;
  wallet_address?: string;
  kyc_status?: string;
}

export interface File extends RowDataPacket {
  id: string;
  filename: string;
  url: string;
  user_id: string;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}