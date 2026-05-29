import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/client'
import { User } from '../types'

const router = Router()

// POST /api/auth/register (original - email/password)
router.post('/register', async (req: Request, res: Response) => {
  console.log('📥 Register hit:', req.body)
  const { email, password, business_name, phone, first_name, middle_name, last_name } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  if (!first_name || !last_name) {
    return res.status(400).json({ message: 'First name and last name are required' })
  }

  try {
    const [existing] = await db.query<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    if ((existing as User[]).length > 0) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('🔐 Hashed password done')

    await db.query(
      `INSERT INTO users (id, email, password, business_name, phone, first_name, middle_name, last_name) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, business_name || null, phone || null, first_name, middle_name || null, last_name]
    )
    console.log('✅ User inserted')

    const [rows] = await db.query<User[]>(
      'SELECT id, email, business_name, phone, first_name, middle_name, last_name, created_at FROM users WHERE email = ?',
      [email]
    )
    const user = (rows as User[])[0]

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name,
        phone: user.phone,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
      }
    })
  } catch (err) {
    console.error('❌ Register error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/login (original - email/password)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    const [rows] = await db.query<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    const user = (rows as User[])[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name,
        phone: user.phone,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// ─── NEW: Wallet-based routes ─────────────────────────────────────────────────

// GET /api/auth/check-wallet?address=0x...
// Check if wallet address exists, return token if yes
router.get('/check-wallet', async (req: Request, res: Response) => {
  const { address } = req.query

  if (!address) {
    return res.status(400).json({ message: 'Wallet address required' })
  }

  try {
    const [rows] = await db.query<User[]>(
      'SELECT id, email, business_name, phone, first_name, middle_name, last_name, wallet_address, kyc_status FROM users WHERE wallet_address = ?',
      [address]
    )
    const user = (rows as User[])[0]

    if (!user) {
      return res.json({ exists: false })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return res.json({
      exists: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name,
        phone: user.phone,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        wallet_address: user.wallet_address,
        kyc_status: user.kyc_status,
      },
    })
  } catch (err) {
    console.error('❌ Check wallet error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/register-wallet
// Register a new user with wallet address (no email/password)
router.post('/register-wallet', async (req: Request, res: Response) => {
  console.log('📥 Register wallet hit:', req.body)
  const { wallet_address, first_name, middle_name, last_name, business_name, phone, email } = req.body


  if (!wallet_address || !first_name || !last_name || !business_name) {
    return res.status(400).json({ message: 'wallet_address, first_name, last_name and business_name are required' })
  }

  try {
    // Check wallet not already registered
    const [existing] = await db.query<User[]>(
      'SELECT id FROM users WHERE wallet_address = ?',
      [wallet_address]
    )
    if ((existing as User[]).length > 0) {
      return res.status(409).json({ message: 'Wallet already registered' })
    }

    await db.query(
      `INSERT INTO users (id, wallet_address, email, first_name, middle_name, last_name, business_name, phone)
   VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [wallet_address, email || null, first_name, middle_name || null, last_name, business_name, phone || null]
    )
    console.log('✅ Wallet user inserted')

    const [rows] = await db.query<User[]>(
      'SELECT id, email, business_name, phone, first_name, middle_name, last_name, wallet_address, kyc_status FROM users WHERE wallet_address = ?',
      [wallet_address]
    )
    const user = (rows as User[])[0]

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name,
        phone: user.phone,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        wallet_address: user.wallet_address,
        kyc_status: user.kyc_status,
      },
    })
  } catch (err) {
    console.error('❌ Register wallet error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
