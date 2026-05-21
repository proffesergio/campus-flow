import { Router } from 'express';
import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './finance.controller';

const router = Router();

/**
 * @openapi
 * /api/finance/dashboard:
 *   get:
 *     tags: [Finance]
 *     summary: Finance dashboard stats
 *     description: Returns collected/pending/overdue totals, monthly chart data, and recent payments.
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole('school_admin', 'finance', 'super_admin'),
  controller.dashboard,
);

// ── Fee Structures ─────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/finance/fee-structures:
 *   get:
 *     tags: [Finance]
 *     summary: List fee structures
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *         description: Filter by class
 *     responses:
 *       200:
 *         description: Array of fee structures
 *   post:
 *     tags: [Finance]
 *     summary: Create a fee structure
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeeStructureInput'
 *     responses:
 *       201:
 *         description: Fee structure created
 */
router.get('/fee-structures', authenticate, controller.getFeeStructures);
router.post(
  '/fee-structures',
  authenticate,
  requireRole('school_admin', 'finance', 'super_admin'),
  controller.addFeeStructure,
);

/**
 * @openapi
 * /api/finance/fee-structures/{id}:
 *   put:
 *     tags: [Finance]
 *     summary: Update a fee structure
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeeStructureInput'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Finance]
 *     summary: Soft-delete a fee structure (archived if invoices exist)
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted/archived
 *       409:
 *         description: Has existing invoices
 */
router.put(
  '/fee-structures/:id',
  authenticate,
  requireRole('school_admin', 'finance', 'super_admin'),
  controller.editFeeStructure,
);
router.delete(
  '/fee-structures/:id',
  authenticate,
  requireRole('school_admin', 'super_admin'),
  controller.removeFeeStructure,
);

// ── Invoices ───────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/finance/invoices:
 *   get:
 *     tags: [Finance]
 *     summary: Paginated invoice list with filters
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: studentId
 *         schema: { type: string }
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, paid, partial, overdue, waived] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated invoices
 *   post:
 *     tags: [Finance]
 *     summary: Create a manual invoice
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceInput'
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.get('/invoices', authenticate, controller.getInvoices);
// Student self-service — must come before /invoices/:id
router.get('/invoices/my', authenticate, requireRole('student'), controller.getMyInvoices);
router.post(
  '/invoices',
  authenticate,
  requireRole('school_admin', 'finance', 'super_admin'),
  controller.addInvoice,
);

/**
 * @openapi
 * /api/finance/invoices/bulk-generate:
 *   post:
 *     tags: [Finance]
 *     summary: Bulk-generate invoices for all active students in a class
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkInvoiceInput'
 *     responses:
 *       201:
 *         description: "{ created: number, total: number }"
 */
router.post(
  '/invoices/bulk-generate',
  authenticate,
  requireRole('school_admin', 'finance', 'super_admin'),
  controller.bulkGenerate,
);

/**
 * @openapi
 * /api/finance/invoices/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get invoice with payment history
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice with payments
 */
router.get('/invoices/:id', authenticate, controller.getInvoiceById);

/**
 * @openapi
 * /api/finance/invoices/{id}/pay-cash:
 *   post:
 *     tags: [Finance]
 *     summary: Record a cash payment against an invoice
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paidAmount]
 *             properties:
 *               paidAmount: { type: number, example: 3500 }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Invoice updated with cash payment
 */
router.post(
  '/invoices/:id/pay-cash',
  authenticate,
  requireRole('school_admin', 'finance', 'super_admin'),
  controller.payCash,
);

/**
 * @openapi
 * /api/finance/invoices/{id}/waive:
 *   post:
 *     tags: [Finance]
 *     summary: Waive an invoice (mark as waived, no payment needed)
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice waived
 */
router.post(
  '/invoices/:id/waive',
  authenticate,
  requireRole('school_admin', 'super_admin'),
  controller.waive,
);

// ── Payment gateways ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/finance/payments/stripe/intent:
 *   post:
 *     tags: [Finance]
 *     summary: Create Stripe PaymentIntent
 *     description: Returns clientSecret for use with Stripe Elements. Requires STRIPE_SECRET_KEY in .env.
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId]
 *             properties:
 *               invoiceId: { type: string }
 *     responses:
 *       200:
 *         description: "{ clientSecret: string }"
 *       503:
 *         description: Stripe not configured
 */
router.post(
  '/payments/stripe/intent',
  authenticate,
  controller.stripeIntent,
);

// Stripe webhook needs raw body — override json parser for this route
router.post(
  '/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  controller.stripeWebhook,
);

/**
 * @openapi
 * /api/finance/payments/sslcommerz/init:
 *   post:
 *     tags: [Finance]
 *     summary: Initiate SSLCommerz payment session
 *     description: Returns gatewayUrl to redirect the user to. Requires SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASS in .env.
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, returnUrl, cancelUrl]
 *             properties:
 *               invoiceId: { type: string }
 *               returnUrl: { type: string, format: uri }
 *               cancelUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: "{ gatewayUrl: string }"
 *       503:
 *         description: SSLCommerz not configured
 */
router.post(
  '/payments/sslcommerz/init',
  authenticate,
  controller.sslCommerzInit,
);

// SSLCommerz IPN — no auth, called by SSLCommerz servers directly
router.post('/payments/sslcommerz/ipn', controller.sslCommerzIPN);

export default router;
