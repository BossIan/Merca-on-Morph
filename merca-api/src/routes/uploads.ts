import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { db } from '../db/client'
import { authenticateToken } from '../middleware/auth'
import { upload } from '../middleware/upload'
import { File } from '../types'

const router = Router()

// POST /api/uploads — upload a file
router.post('/', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }

  const fileUrl = `/uploads/${req.file.filename}`

  try {
    await db.query(
      'INSERT INTO files (id, filename, url, user_id) VALUES (UUID(), ?, ?, ?)',
      [req.file.originalname, fileUrl, req.user!.userId]
    )

    const [rows] = await db.query<File[]>(
      'SELECT * FROM files WHERE url = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
      [fileUrl, req.user!.userId]
    )

    return res.status(201).json((rows as File[])[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/uploads — list all files for current user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query<File[]>(
      'SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC',
      [req.user!.userId]
    )
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/uploads/:id — delete a file
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query<File[]>(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.userId]
    )
    const file = (rows as File[])[0]

    if (!file) return res.status(404).json({ message: 'File not found' })

    // Delete from disk
    const filePath = path.join(__dirname, '../../', file.url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    // Delete from DB
    await db.query('DELETE FROM files WHERE id = ?', [req.params.id])

    return res.json({ message: 'File deleted' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
