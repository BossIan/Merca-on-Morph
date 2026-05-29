import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { db } from '../db/client'
import jwt from 'jsonwebtoken'

const router = Router()

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/kyc'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype)
    if (ext && mime) cb(null, true)
    else cb(new Error('Only images and PDFs are allowed'))
  }
})

// Middleware to verify JWT
const authMiddleware = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// POST /api/kyc/submit
router.post(
  '/submit',
  authMiddleware,
  upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  async (req: any, res: Response) => {
    const { document_type } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    if (!document_type || !files.front || !files.selfie) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const frontUrl = `/uploads/kyc/${files.front[0].filename}`
    const backUrl = files.back ? `/uploads/kyc/${files.back[0].filename}` : null
    const selfieUrl = `/uploads/kyc/${files.selfie[0].filename}`

    try {
      await db.query(
        `UPDATE users SET 
          kyc_status = 'pending',
          kyc_document_type = ?,
          kyc_front_url = ?,
          kyc_back_url = ?,
          kyc_selfie_url = ?,
          kyc_submitted_at = NOW()
        WHERE id = ?`,
        [document_type, frontUrl, backUrl, selfieUrl, req.user.userId]
      )

      return res.json({ message: 'KYC submitted successfully', status: 'pending' })
    } catch (err) {
      console.error('KYC submit error:', err)
      return res.status(500).json({ message: 'Server error' })
    }
  }
)

// GET /api/kyc/status
router.get('/status', authMiddleware, async (req: any, res: Response) => {
  try {
    const [rows] = await db.query(
      'SELECT kyc_status, kyc_document_type, kyc_submitted_at FROM users WHERE id = ?',
      [req.user.userId]
    ) as any[]

    const user = (rows as any[])[0]
    return res.json({ kyc_status: user.kyc_status, document_type: user.kyc_document_type, submitted_at: user.kyc_submitted_at })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router