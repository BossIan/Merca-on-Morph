import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/client'
import { authenticateToken } from '../middleware/auth'
import { User } from '../types'

const router = Router()

// GET /api/users/me — get current logged-in user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query<User[]>(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    )
    const user = (rows as User[])[0]

    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.json(user)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// PUT /api/users/me — update name or password
router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  const { name, password } = req.body

  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 12)
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user!.userId])
    }

    if (name !== undefined) {
      await db.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user!.userId])
    }

    const [rows] = await db.query<User[]>(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    )

    return res.json((rows as User[])[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/users/me — delete own account
router.delete('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.user!.userId])
    return res.json({ message: 'Account deleted' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
