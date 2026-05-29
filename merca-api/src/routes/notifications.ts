import { Router, Response } from 'express'
import { db } from '../db/client'
import jwt from 'jsonwebtoken'

const router = Router()

const authMiddleware = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// GET /api/notifications — list all for user
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    ) as any[]
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authMiddleware, async (req: any, res: Response) => {
  try {
    await db.query(
      'UPDATE notifications SET status = ? WHERE id = ? AND user_id = ?',
      ['read', req.params.id, req.user.userId]
    )
    return res.json({ message: 'Marked as read' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authMiddleware, async (req: any, res: Response) => {
  try {
    await db.query(
      'UPDATE notifications SET status = ? WHERE user_id = ?',
      ['read', req.user.userId]
    )
    return res.json({ message: 'All marked as read' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/notifications — internal helper to create a notification
router.post('/', authMiddleware, async (req: any, res: Response) => {
  const { type, title, message } = req.body
  if (!type || !title || !message) return res.status(400).json({ message: 'Missing fields' })
  
  const notificationId = crypto.randomUUID() 

  try {
    await db.query(
      'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
      [notificationId, req.user.userId, type, title, message]
    )
    return res.status(201).json({ message: 'Notification created', id: notificationId })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router