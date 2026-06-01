import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type {
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  CreateInvoiceInput,
  BulkGenerateInput,
  PayCashInput,
  InvoiceListQuery,
} from './finance.validator';

// ── Fee Structures ─────────────────────────────────────────────────────────────

export async function listFeeStructures(schoolId: string, classId?: string) {
  return prisma.feeStructure.findMany({
    where: { schoolId, isActive: true, ...(classId ? { classId } : {}) },
    include: {
      class: { select: { name: true, section: true } },
      _count: { select: { invoices: true } },
    },
    orderBy: [{ feeType: 'asc' }, { name: 'asc' }],
  });
}

export async function createFeeStructure(schoolId: string, data: CreateFeeStructureInput) {
  if (data.classId) {
    const cls = await prisma.class.findFirst({ where: { id: data.classId, schoolId } });
    if (!cls) throw new AppError(404, 'Class not found');
  }

  return prisma.feeStructure.create({
    data: {
      schoolId,
      name: data.name,
      classId: data.classId ?? null,
      description: data.description ?? null,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency,
      feeType: data.feeType,
      academicYear: data.academicYear,
      dueDay: data.dueDay ?? null,
    },
  });
}

export async function updateFeeStructure(
  schoolId: string,
  id: string,
  data: UpdateFeeStructureInput,
) {
  const fs = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
  if (!fs) throw new AppError(404, 'Fee structure not found');

  return prisma.feeStructure.update({ where: { id }, data });
}

export async function deleteFeeStructure(schoolId: string, id: string) {
  const fs = await prisma.feeStructure.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { invoices: true } } },
  });
  if (!fs) throw new AppError(404, 'Fee structure not found');
  if (fs._count.invoices > 0)
    throw new AppError(409, 'Cannot delete — invoices exist for this fee structure');

  await prisma.feeStructure.update({ where: { id }, data: { isActive: false } });
}

// ── Invoices ───────────────────────────────────────────────────────────────────

export async function listInvoices(schoolId: string, query: InvoiceListQuery) {
  const { studentId, classId, status, from, to, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { schoolId };
  if (studentId) where['studentId'] = studentId;
  if (status) where['status'] = status;
  if (from || to) {
    where['dueDate'] = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (classId) where['student'] = { classId };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            rollNumber: true,
            class: { select: { name: true, section: true } },
          },
        },
        feeStructure: { select: { name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getInvoice(schoolId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, schoolId },
    include: {
      student: { select: { firstName: true, lastName: true, rollNumber: true } },
      feeStructure: { select: { name: true } },
      payments: { orderBy: { paidAt: 'desc' } },
    },
  });
  if (!invoice) throw new AppError(404, 'Invoice not found');
  return invoice;
}

export async function createInvoice(schoolId: string, data: CreateInvoiceInput) {
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, schoolId },
  });
  if (!student) throw new AppError(404, 'Student not found');

  return prisma.invoice.create({
    data: {
      schoolId,
      studentId: data.studentId,
      feeStructureId: data.feeStructureId ?? null,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      dueDate: new Date(data.dueDate),
      notes: data.notes ?? null,
    },
  });
}

export async function bulkGenerateInvoices(schoolId: string, data: BulkGenerateInput) {
  const [cls, fs] = await Promise.all([
    prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
    prisma.feeStructure.findFirst({ where: { id: data.feeStructureId, schoolId, isActive: true } }),
  ]);

  if (!cls) throw new AppError(404, 'Class not found');
  if (!fs) throw new AppError(404, 'Fee structure not found');

  const students = await prisma.student.findMany({
    where: { classId: data.classId, schoolId, status: 'active' },
    select: { id: true },
  });

  if (students.length === 0) throw new AppError(400, 'No active students in this class');

  const dueDate = new Date(data.dueDate);

  const created = await prisma.invoice.createMany({
    data: students.map((s) => ({
      schoolId,
      studentId: s.id,
      feeStructureId: fs.id,
      title: fs.name,
      amount: fs.amount,
      currency: fs.currency,
      dueDate,
      notes: data.notes ?? null,
    })),
    skipDuplicates: false,
  });

  return { created: created.count, total: students.length };
}

export async function recordCashPayment(
  schoolId: string,
  invoiceId: string,
  data: PayCashInput,
) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
  if (!invoice) throw new AppError(404, 'Invoice not found');

  const newPaid = Number(invoice.paidAmount) + data.paidAmount;
  const totalAmount = Number(invoice.amount);
  const newStatus =
    newPaid >= totalAmount ? 'paid' : newPaid > 0 ? 'partial' : invoice.status;

  const [, updated] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        schoolId,
        invoiceId,
        amount: data.paidAmount,
        currency: invoice.currency,
        method: 'cash',
        gateway: 'cash',
        status: 'success',
        paidAt: new Date(),
        metadata: data.notes ? { notes: data.notes } : undefined,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaid,
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
        paymentMethod: 'cash',
        notes: data.notes ?? invoice.notes,
      },
    }),
  ]);

  return updated;
}

export async function waiveInvoice(schoolId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
  if (!invoice) throw new AppError(404, 'Invoice not found');

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'waived' },
  });
}

// ── Stripe ─────────────────────────────────────────────────────────────────────

export async function createStripePaymentIntent(schoolId: string, invoiceId: string) {
  const stripeKey = process.env['STRIPE_SECRET_KEY'];
  if (!stripeKey) throw new AppError(503, 'Stripe not configured — add STRIPE_SECRET_KEY to .env');

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
  if (!invoice) throw new AppError(404, 'Invoice not found');
  if (invoice.status === 'paid') throw new AppError(409, 'Invoice already paid');

  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(stripeKey);

  const remainingAmount = Number(invoice.amount) - Number(invoice.paidAmount);

  const intent = await stripe.paymentIntents.create(
    {
      amount: Math.round(remainingAmount * 100),
      currency: invoice.currency.toLowerCase() === 'bdt' ? 'usd' : invoice.currency.toLowerCase(),
      metadata: { invoiceId, schoolId },
    },
    // idempotencyKey is a request option, not a body param — keyed on the
    // invoice + remaining amount so retries of the same charge are deduped.
    { idempotencyKey: `invoice-${invoiceId}-${Math.round(remainingAmount * 100)}` },
  );

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { stripePaymentIntentId: intent.id },
  });

  return { clientSecret: intent.client_secret };
}

export async function handleStripeWebhook(body: Buffer, signature: string) {
  const stripeKey = process.env['STRIPE_SECRET_KEY'];
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!stripeKey || !webhookSecret) return { received: true };

  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(stripeKey);

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    throw new AppError(400, 'Invalid Stripe webhook signature');
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const invoice = await prisma.invoice.findFirst({
      where: { stripePaymentIntentId: intent.id },
    });
    if (invoice) {
      const paidAmount = intent.amount / 100;
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            schoolId: invoice.schoolId,
            invoiceId: invoice.id,
            amount: paidAmount,
            currency: intent.currency.toUpperCase(),
            method: 'stripe',
            gateway: 'stripe',
            gatewayRef: intent.id,
            status: 'success',
            metadata: { stripeIntentId: intent.id },
          },
        }),
        prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: Number(invoice.paidAmount) + paidAmount,
            status: 'paid',
            paidAt: new Date(),
            paymentMethod: 'stripe',
            transactionId: intent.id,
          },
        }),
      ]);
    }
  }

  return { received: true };
}

// ── SSLCommerz ────────────────────────────────────────────────────────────────

export async function initiateSSLCommerz(
  schoolId: string,
  invoiceId: string,
  returnUrl: string,
  cancelUrl: string,
) {
  const storeId = process.env['SSLCOMMERZ_STORE_ID'];
  const storePass = process.env['SSLCOMMERZ_STORE_PASS'];
  if (!storeId || !storePass)
    throw new AppError(503, 'SSLCommerz not configured — add SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASS to .env');

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, schoolId },
    include: { student: { select: { firstName: true, lastName: true, guardianEmail: true, guardianPhone: true } } },
  });
  if (!invoice) throw new AppError(404, 'Invoice not found');
  if (invoice.status === 'paid') throw new AppError(409, 'Invoice already paid');

  const isLive = process.env['SSLCOMMERZ_IS_LIVE'] === 'true';
  const baseUrl = isLive
    ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

  const remaining = Number(invoice.amount) - Number(invoice.paidAmount);

  const params = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePass,
    total_amount: String(remaining),
    currency: invoice.currency,
    tran_id: `CF-${invoiceId}-${Date.now()}`,
    success_url: returnUrl,
    fail_url: cancelUrl,
    cancel_url: cancelUrl,
    ipn_url: `${process.env['API_BASE_URL'] ?? 'http://localhost:3001'}/api/finance/payments/sslcommerz/ipn`,
    cus_name: `${invoice.student.firstName} ${invoice.student.lastName}`,
    cus_email: invoice.student.guardianEmail ?? 'noreply@campusflow.app',
    cus_phone: invoice.student.guardianPhone,
    cus_add1: 'Bangladesh',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    product_name: invoice.title,
    product_category: 'Education',
    product_profile: 'non-physical-goods',
  });

  const { default: axios } = await import('axios');
  const res = await axios.post<{ status: string; GatewayPageURL?: string; sessionkey?: string }>(
    baseUrl,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  if (res.data.status !== 'SUCCESS' || !res.data.GatewayPageURL)
    throw new AppError(502, 'SSLCommerz session initiation failed');

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { sslSessionKey: res.data.sessionkey },
  });

  return { gatewayUrl: res.data.GatewayPageURL };
}

export async function handleSSLCommerzIPN(data: Record<string, string>) {
  const storeId = process.env['SSLCOMMERZ_STORE_ID'];
  const storePass = process.env['SSLCOMMERZ_STORE_PASS'];
  if (!storeId || !storePass) return;

  if (data['status'] !== 'VALID') return;

  const invoiceId = data['tran_id']?.split('-')[1];
  if (!invoiceId) return;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === 'paid') return;

  const paidAmount = parseFloat(data['amount'] ?? '0');

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        schoolId: invoice.schoolId,
        invoiceId: invoice.id,
        amount: paidAmount,
        currency: data['currency'] ?? invoice.currency,
        method: 'sslcommerz',
        gateway: 'sslcommerz',
        gatewayRef: data['bank_tran_id'],
        status: 'success',
        metadata: { sslTranId: data['tran_id'], bankTranId: data['bank_tran_id'] },
      },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: Number(invoice.paidAmount) + paidAmount,
        status: Number(invoice.paidAmount) + paidAmount >= Number(invoice.amount) ? 'paid' : 'partial',
        paidAt: new Date(),
        paymentMethod: 'sslcommerz',
        transactionId: data['bank_tran_id'],
      },
    }),
  ]);
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export async function getDashboardStats(schoolId: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  const [allInvoices, thisMonthPayments, recentPayments] = await Promise.all([
    prisma.invoice.findMany({
      where: { schoolId },
      select: { status: true, amount: true, paidAmount: true, dueDate: true, currency: true, paidAt: true },
    }),
    prisma.payment.findMany({
      where: {
        schoolId,
        status: 'success',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { schoolId, status: 'success' },
      include: {
        invoice: {
          select: {
            title: true,
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalCollected = allInvoices
    .filter((i) => i.status === 'paid' || i.status === 'partial')
    .reduce((s, i) => s + Number(i.paidAmount), 0);

  const totalPending = allInvoices
    .filter((i) => i.status === 'pending')
    .reduce((s, i) => s + Number(i.amount), 0);

  const totalOverdue = allInvoices
    .filter((i) => i.status === 'pending' && new Date(i.dueDate) < now)
    .reduce((s, i) => s + Number(i.amount), 0);

  const collectedThisMonth = thisMonthPayments.reduce((s, p) => s + Number(p.amount), 0);

  // Monthly collection for last 6 months
  const monthlyData: Array<{ month: string; amount: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('en-BD', { month: 'short', year: '2-digit' });
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    const total = allInvoices
      .filter((inv) => inv.paidAt && inv.paidAt >= start && inv.paidAt <= end)
      .reduce((s, inv) => s + Number(inv.paidAmount), 0);
    monthlyData.push({ month: label, amount: total });
  }

  return {
    totalCollected,
    totalPending,
    totalOverdue,
    collectedThisMonth,
    overdueCount: allInvoices.filter((i) => i.status === 'pending' && new Date(i.dueDate) < now).length,
    pendingCount: allInvoices.filter((i) => i.status === 'pending').length,
    monthlyData,
    recentPayments,
  };
}
