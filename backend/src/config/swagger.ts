import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CampusFlow API',
      version: '1.0.0',
      description: `
## CampusFlow — Multi-tenant School Management SaaS

### How to authenticate
1. \`POST /api/auth/register-school\` — create your school (no auth needed, no X-School-Slug header)
2. \`POST /api/auth/login\` — get JWT cookies (access_token + refresh_token)
3. All subsequent requests auto-send cookies from the browser / Postman cookie jar

### Multi-tenancy (dev mode)
Add header \`X-School-Slug: your-school-slug\` to every request except \`register-school\`.
In production this is replaced by subdomain routing (\`slug.campusflow.app\`).

### Response envelope
Every response follows \`{ success: boolean, data?: T, message?: string, details?: any }\`

### Roles (least → most privileged)
\`student\` · \`parent\` · \`finance\` · \`teacher\` · \`school_admin\` · \`super_admin\`
      `,
      contact: { name: 'CampusFlow Support', email: 'support@campusflow.app' },
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
      { url: 'https://api.campusflow.app', description: 'Production' },
    ],
    tags: [
      { name: 'Health', description: 'Service health' },
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Classes', description: 'Class & section management' },
      { name: 'Students', description: 'Student records & profiles' },
      { name: 'Attendance', description: 'Daily attendance tracking' },
      { name: 'Exams', description: 'Exam scheduling, grade entry & report cards' },
      { name: 'Finance', description: 'Fee structures, invoices & payment processing' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
          description: 'JWT access token (set automatically after login)',
        },
      },
      parameters: {
        SchoolSlug: {
          in: 'header',
          name: 'X-School-Slug',
          required: true,
          schema: { type: 'string', example: 'dhaka-grammar' },
          description: 'School slug — dev mode only (production uses subdomain)',
        },
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20, maximum: 100 },
        },
      },
      schemas: {
        // ── Generic ───────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            details: { type: 'object' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 84 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        // ── Auth ──────────────────────────────────────────────────────────────
        RegisterSchoolInput: {
          type: 'object',
          required: ['schoolName', 'schoolSlug', 'adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword'],
          properties: {
            schoolName: { type: 'string', example: 'Dhaka Grammar School' },
            schoolSlug: { type: 'string', example: 'dhaka-grammar', pattern: '^[a-z0-9-]+$' },
            adminFirstName: { type: 'string', example: 'Ahmed' },
            adminLastName: { type: 'string', example: 'Rahman' },
            adminEmail: { type: 'string', format: 'email', example: 'admin@dgs.edu.bd' },
            adminPassword: { type: 'string', minLength: 8, example: 'Admin1234!' },
            adminPhone: { type: 'string', example: '+8801700000000' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@dgs.edu.bd' },
            password: { type: 'string', example: 'Admin1234!' },
          },
        },
        // ── Classes ───────────────────────────────────────────────────────────
        ClassInput: {
          type: 'object',
          required: ['name', 'academicYear'],
          properties: {
            name: { type: 'string', example: 'Grade 6' },
            section: { type: 'string', example: 'A' },
            academicYear: { type: 'string', example: '2025-26' },
            teacherId: { type: 'string', example: 'cuid...' },
            capacity: { type: 'integer', example: 40 },
          },
        },
        // ── Students ──────────────────────────────────────────────────────────
        StudentInput: {
          type: 'object',
          required: ['firstName', 'lastName', 'classId', 'guardianName', 'guardianPhone'],
          properties: {
            firstName: { type: 'string', example: 'Nadia' },
            lastName: { type: 'string', example: 'Islam' },
            classId: { type: 'string', example: 'cuid...' },
            rollNumber: { type: 'string', example: '01' },
            dateOfBirth: { type: 'string', format: 'date', example: '2012-05-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            guardianName: { type: 'string', example: 'Karim Islam' },
            guardianPhone: { type: 'string', example: '+8801800000001' },
            guardianEmail: { type: 'string', format: 'email' },
            address: { type: 'string' },
            createPortalAccess: { type: 'boolean', default: false },
          },
        },
        // ── Attendance ────────────────────────────────────────────────────────
        MarkAttendanceInput: {
          type: 'object',
          required: ['classId', 'date', 'records'],
          properties: {
            classId: { type: 'string' },
            date: { type: 'string', format: 'date', example: '2026-05-20' },
            records: {
              type: 'array',
              items: {
                type: 'object',
                required: ['studentId', 'status'],
                properties: {
                  studentId: { type: 'string' },
                  status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        // ── Finance ───────────────────────────────────────────────────────────
        FeeStructureInput: {
          type: 'object',
          required: ['name', 'amount', 'frequency', 'feeType', 'academicYear'],
          properties: {
            name: { type: 'string', example: 'Monthly Tuition' },
            classId: { type: 'string', description: 'Limit to specific class (null = all classes)' },
            description: { type: 'string' },
            amount: { type: 'number', example: 3500 },
            currency: { type: 'string', default: 'BDT', example: 'BDT' },
            frequency: { type: 'string', enum: ['monthly', 'quarterly', 'annual', 'one_time'] },
            feeType: { type: 'string', enum: ['tuition', 'exam', 'admission', 'transport', 'library', 'other'] },
            academicYear: { type: 'string', example: '2025-26' },
            dueDay: { type: 'integer', minimum: 1, maximum: 31, description: 'Day of month fee is due' },
          },
        },
        InvoiceInput: {
          type: 'object',
          required: ['studentId', 'title', 'amount', 'dueDate'],
          properties: {
            studentId: { type: 'string' },
            feeStructureId: { type: 'string' },
            title: { type: 'string', example: 'May 2026 Tuition' },
            amount: { type: 'number', example: 3500 },
            currency: { type: 'string', default: 'BDT' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-05-31T00:00:00.000Z' },
            notes: { type: 'string' },
          },
        },
        BulkInvoiceInput: {
          type: 'object',
          required: ['classId', 'feeStructureId', 'dueDate'],
          properties: {
            classId: { type: 'string' },
            feeStructureId: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.ts'),
    path.join(__dirname, '../modules/**/*.routes.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
