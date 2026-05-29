import { Router, Response } from 'express'
import { db } from '../db/client'
import jwt from 'jsonwebtoken'
import { ethers } from "ethers";

const router = Router()

// Ethers Configuration Constants
const mercaInvoiceAbi = [
  "function payInvoice(bytes32 id) external"
];

const usdcAbi = [
  "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://rpc-quickstart.morphl2.io");
const relayerWallet = new ethers.Wallet(process.env.MERCA_PRIVATE_KEY!, provider);

// Auth Middleware for Merchant Dashboards
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

// POST /api/invoices — create invoice
router.post('/', authMiddleware, async (req: any, res: Response) => {
  const { customer_name, customer_email, amount, description, currency, due_date } = req.body

  if (!customer_name || !customer_email || !amount || !due_date) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const fee = parseFloat((amount * 0.005).toFixed(2))
  const net = parseFloat((amount - fee).toFixed(2))

  try {
    const [countRows] = await db.query(
      'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?',
      [req.user.userId]
    ) as any[]
    const count = (countRows as any[])[0].count + 1
    const invoice_number = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`
    const payment_link = `https://pay.merca.io/${invoice_number.toLowerCase()}`

    await db.query(
      `INSERT INTO invoices (id, invoice_number, user_id, customer_name, customer_email, amount, fee, net, description, currency, due_date, payment_link)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, req.user.userId, customer_name, customer_email, amount, fee, net, description, currency, due_date, payment_link]
    )

    const [rows] = await db.query(
      'SELECT * FROM invoices WHERE invoice_number = ? AND user_id = ?',
      [invoice_number, req.user.userId]
    ) as any[]

    return res.status(201).json((rows as any[])[0])
  } catch (err) {
    console.error('Invoice create error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/invoices — list all invoices for user (or filter by on_chain_id)
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const { on_chain_id } = req.query

    if (on_chain_id) {
      const [rows] = await db.query(
        'SELECT * FROM invoices WHERE user_id = ? AND on_chain_id = ?',
        [req.user.userId, on_chain_id]
      ) as any[]
      return res.json(rows)
    }

    const [rows] = await db.query(
      'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    ) as any[]
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/invoices/:id — get single invoice
router.get('/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM invoices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    ) as any[]
    const invoice = (rows as any[])[0]
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    return res.json(invoice)
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/invoices/:id — update on_chain_id after blockchain creation
router.patch('/:id', authMiddleware, async (req: any, res: Response) => {
  const { on_chain_id } = req.body

  if (!on_chain_id) {
    return res.status(400).json({ message: 'on_chain_id is required' })
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM invoices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    ) as any[]

    const invoice = (rows as any[])[0]
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    const payment_link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/${on_chain_id}`

    await db.query(
      'UPDATE invoices SET on_chain_id = ?, payment_link = ? WHERE id = ? AND user_id = ?',
      [on_chain_id, payment_link, req.params.id, req.user.userId]
    )

    const [updated] = await db.query(
      'SELECT * FROM invoices WHERE id = ?',
      [req.params.id]
    ) as any[]

    return res.json((updated as any[])[0])
  } catch (err) {
    console.error('Invoice patch error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/invoices/mark-paid/:on_chain_id — mark invoice as paid manually
router.post('/mark-paid/:on_chain_id', authMiddleware, async (req: any, res: Response) => {
  const { on_chain_id } = req.params

  if (!on_chain_id) {
    return res.status(400).json({ message: 'on_chain_id is required' })
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM invoices WHERE on_chain_id = ? AND user_id = ?',
      [on_chain_id, req.user.userId]
    ) as any[]

    const invoice = (rows as any[])[0]
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    await db.query(
      'UPDATE invoices SET paid_date = NOW() WHERE on_chain_id = ? AND user_id = ?',
      [on_chain_id, req.user.userId]
    )

    const [updated] = await db.query(
      'SELECT * FROM invoices WHERE on_chain_id = ?',
      [on_chain_id]
    ) as any[]

    return res.json((updated as any[])[0])
  } catch (err) {
    console.error('Mark paid error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/invoices/pay-gasless
router.post("/pay-gasless", async (req: any, res: Response) => {
  const {
    invoiceId,
    fromAddress,
    amount,
    validAfter,
    validBefore,
    nonce,
    signature
  } = req.body;

  try {
    const flatUuid = invoiceId.replace(/-/g, "").replace(/^0x/, "");
    const bytes32InvoiceId = `0x${flatUuid}`;
    const cleanNonce = nonce.startsWith("0x") ? nonce : `0x${nonce}`;
    const sigComponents = ethers.Signature.from(signature);

    // 1. Create a contract instance for the USDC Token directly
    const usdcAbi = [
      "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
      "function approve(address spender, uint256 amount) external returns (bool)"
    ];
    const usdcContract = new ethers.Contract(process.env.USDC_MORPH!, usdcAbi, relayerWallet);

    // 2. Create the standard Invoice contract instance
    const invoiceContract = new ethers.Contract(process.env.MERCA_INVOICE!, mercaInvoiceAbi, relayerWallet);

    console.log("Step 1: Pulling USDC from customer to relayer wallet...");
    const relayerAddress = await relayerWallet.getAddress();
    
    const pullTx = await usdcContract.receiveWithAuthorization(
      fromAddress,
      relayerAddress, // Must match the 'to' field signed on the frontend
      BigInt(amount),
      BigInt(validAfter),
      BigInt(validBefore),
      cleanNonce,
      sigComponents.v,
      sigComponents.r,
      sigComponents.s
    );
    await pullTx.wait();

    console.log("Step 2: Approving MercaInvoice contract to spend relayer's new USDC...");
    const approveTx = await usdcContract.approve(process.env.MERCA_INVOICE!, BigInt(amount));
    await approveTx.wait();

    console.log("Step 3: Settling the invoice via the native payInvoice function...");
    // 💡 Calling the standard payInvoice from the relayer wallet!
    const payTx = await invoiceContract.payInvoice(bytes32InvoiceId);
    const receipt = await payTx.wait();

    // 4. Update Database
    await db.query(
      "UPDATE invoices SET paid_date = NOW() WHERE id = ?",
      [invoiceId]
    );

    return res.status(200).json({
      success: true,
      txHash: receipt?.hash
    });

  } catch (error: any) {
    console.error("Relayer fallback failure:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Gasless routing pipeline failed"
    });
  }
});

// POST /api/invoices/confirm-payment — confirm direct payment
router.post("/confirm-payment", async (req: any, res: Response) => {
  const { invoiceId, txHash, fromAddress } = req.body;

  try {
    // Update invoice to paid status
    await db.query(
      "UPDATE invoices SET paid_date = NOW(), status = 'Paid' WHERE id = ?",
      [invoiceId]
    );

    return res.status(200).json({
      success: true,
      message: "Payment confirmed",
      txHash: txHash
    });
  } catch (error: any) {
    console.error("Payment confirmation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment"
    });
  }
});

export default router;