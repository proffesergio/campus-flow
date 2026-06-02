import { Request, Response, NextFunction } from 'express';
import * as service from './finance.service';
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  createInvoiceSchema,
  bulkGenerateSchema,
  payCashSchema,
  invoiceListQuerySchema,
  stripeIntentSchema,
  sslCommerzInitSchema,
} from './finance.validator';

// ── Fee Structures ─────────────────────────────────────────────────────────────

export async function getFeeStructures(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId } = req.query as { classId?: string };
    const data = await service.listFeeStructures(req.tenant.schoolId, classId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function addFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createFeeStructureSchema.parse(req.body);
    const result = await service.createFeeStructure(req.tenant.schoolId, data);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function editFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateFeeStructureSchema.parse(req.body);
    const result = await service.updateFeeStructure(req.tenant.schoolId, req.params.id, data);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function removeFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteFeeStructure(req.tenant.schoolId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// ── Invoices ───────────────────────────────────────────────────────────────────

export async function getMyInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { prisma } = await import('../../config/prisma');
    const student = await prisma.student.findFirst({
      where: { userId: req.user.userId, schoolId: req.tenant.schoolId },
    });
    if (!student) {
      res.status(404).json({ success: false, message: 'No student record linked' });
      return;
    }
    const result = await service.listInvoices(req.tenant.schoolId, {
      studentId: student.id,
      page: 1,
      limit: 50,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const query = invoiceListQuerySchema.parse(req.query);
    const result = await service.listInvoices(req.tenant.schoolId, query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getInvoiceById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getInvoice(req.tenant.schoolId, req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function addInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createInvoiceSchema.parse(req.body);
    const result = await service.createInvoice(req.tenant.schoolId, data);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function bulkGenerate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkGenerateSchema.parse(req.body);
    const result = await service.bulkGenerateInvoices(req.tenant.schoolId, data);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function payCash(req: Request, res: Response, next: NextFunction) {
  try {
    const data = payCashSchema.parse(req.body);
    const result = await service.recordCashPayment(req.tenant.schoolId, req.params.id, data);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function sendReceipt(res: Response, schoolId: string, paymentId: string) {
  const pdf = await service.getPaymentReceiptPdf(schoolId, paymentId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="receipt-${paymentId.slice(-8)}.pdf"`);
  res.send(pdf);
}

/** GET /payments/:id/receipt — receipt for a specific payment. */
export async function downloadReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    await sendReceipt(res, req.tenant.schoolId, req.params.id);
  } catch (err) { next(err); }
}

/** GET /invoices/:id/receipt — receipt for an invoice's latest successful payment. */
export async function downloadInvoiceReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const paymentId = await service.latestPaymentIdForInvoice(req.tenant.schoolId, req.params.id);
    if (!paymentId) {
      res.status(404).json({ success: false, message: 'No payment found for this invoice' });
      return;
    }
    await sendReceipt(res, req.tenant.schoolId, paymentId);
  } catch (err) { next(err); }
}

export async function waive(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.waiveInvoice(req.tenant.schoolId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// ── Payments ───────────────────────────────────────────────────────────────────

export async function stripeIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId } = stripeIntentSchema.parse(req.body);
    const result = await service.createStripePaymentIntent(req.tenant.schoolId, invoiceId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const result = await service.handleStripeWebhook(req.body as Buffer, sig);
    res.json(result);
  } catch (err) { next(err); }
}

export async function sslCommerzInit(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, returnUrl, cancelUrl } = sslCommerzInitSchema.parse(req.body);
    const result = await service.initiateSSLCommerz(
      req.tenant.schoolId,
      invoiceId,
      returnUrl,
      cancelUrl,
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function sslCommerzIPN(req: Request, res: Response) {
  await service.handleSSLCommerzIPN(req.body as Record<string, string>);
  res.status(200).send('OK');
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getDashboardStats(req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
