import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import uploadRoutes from './routes/uploads'

import kycRouter from './routes/kyc'
import invoiceRoutes from './routes/invoices'
import notificationsRouter from './routes/notifications'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use('/api/notifications', notificationsRouter)

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/uploads', uploadRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})


app.use('/api/kyc', kycRouter)
app.use('/uploads', express.static('uploads')) // serve uploaded files

app.use('/api/invoices', invoiceRoutes)