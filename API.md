# CampusFlow REST API Reference

Base URL (dev): `http://localhost:3001/api`
Interactive docs (Swagger UI): **`http://localhost:3001/api/docs`** · OpenAPI JSON: `/api/openapi.json`

---

## Conventions

- **Tenant** — every `/api/*` route (except auth + health) requires the school to be identified:
  - Production: subdomain (`dhaka-model.campusflow.app`)
  - Dev: header **`X-School-Slug: dhaka-model`**
- **Auth** — JWT in an **httpOnly cookie** (`access_token`), set on login. A `Bearer` token in
  `Authorization` is also accepted. Refresh via `/auth/refresh` (uses the `refresh_token` cookie).
- **Roles** — `super_admin · school_admin · teacher · finance · student · parent`.
- **Response envelope** — `{ "success": true, "data": ... }` or paginated
  `{ "success": true, "items": [...], "meta": { total, page, limit, totalPages } }`.
  Errors: `{ "success": false, "message": "...", "details"? }`.
- **Status codes** — `400` no tenant · `401` unauthenticated · `403` wrong role / not owner
  · `404` not found · `409` conflict · `422` validation failed.

---

## Auth — `/api/auth`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/register-school` | public | Create a school + its first admin. Returns tokens (cookies). |
| POST | `/login` | public | Log in; sets `access_token` + `refresh_token` cookies. |
| POST | `/refresh` | cookie | Issue a new access token from the refresh cookie. |
| POST | `/logout` | public | Clear auth cookies. |
| GET | `/me` | any | Current user profile. |

**Login body:** `{ "email": "...", "password": "..." }` (+ `X-School-Slug`).

---

## Students — `/api/students`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | staff | Paginated list. Query: `page, limit, search, classId, status`. |
| POST | `/` | school_admin | Create a student. |
| GET | `/stats` | staff | `{ total, active, thisMonth }`. |
| GET | `/:id` | staff | One student. |
| GET | `/:id/profile` | staff | Full profile (grades/attendance/fees). |
| PUT | `/:id` | school_admin | Update. |
| DELETE | `/:id` | school_admin | Deactivate. |
| GET | `/me` · `/me/dashboard` · `/me/ranking` | student | Student self-service. |

> Note: the list returns students at `items` (`{ success, items, meta }`).

---

## Classes — `/api/classes`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | staff | List classes. |
| POST | `/` | school_admin | Create class (`name, section?, academicYear, teacherId?, capacity?`). |
| PUT | `/:id` | school_admin | Update. |
| DELETE | `/:id` | school_admin | Delete. |

---

## Attendance — `/api/attendance`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/mark` | teacher/admin | Mark a class for a date (`classId, date, records[]`). |
| GET | `/` | staff | Class attendance for a date. |
| GET | `/today-status` | staff | Today's marking status per class. |
| GET | `/summary` | staff | Monthly summary (`classId, month`). |
| GET | `/student/:studentId` | staff | A student's history. |
| GET | `/my-history` | student | Own history. |

---

## Exams & Grades — `/api/exams`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/subjects` | staff | Subjects (filter by class). |
| GET | `/` | staff | Exams list (`classId, subjectId, term, examType, page, limit`). |
| GET | `/:id` · `/:id/grades` | staff | Exam detail + grade sheet. |
| GET | `/grades/student/:studentId` | staff | A student's grades. |
| GET | `/grades/my-grades` · `/my` | student | Own grades / exams. |

(POST/PUT for subjects, exams, and bulk grades are defined in the module; see Swagger for bodies.)

---

## Finance — `/api/finance`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | finance/admin | Collection stats + 6-month trend. |
| GET | `/fee-structures` | staff | List fee structures. |
| POST | `/fee-structures` | finance/admin | Create. |
| PUT/DELETE | `/fee-structures/:id` | finance/admin | Update / delete. |
| GET | `/invoices` | staff | List (`studentId, classId, status, page, limit`). |
| POST | `/invoices` | finance/admin | Create invoice. |
| POST | `/invoices/bulk-generate` | finance/admin | Generate for a class. |
| GET | `/invoices/:id` | staff | Invoice + payments. |
| GET | `/invoices/my` | student | Own invoices. |
| POST | `/invoices/:id/pay-cash` | finance/admin | Record cash payment. |
| POST | `/invoices/:id/waive` | finance/admin | Waive. |
| **GET** | **`/invoices/:id/receipt`** | finance/admin | **PDF receipt (latest payment).** |
| **GET** | **`/payments/:id/receipt`** | finance/admin | **PDF receipt for a payment.** |
| POST | `/payments/stripe/intent` | student/parent | Create Stripe intent. |
| POST | `/payments/stripe/webhook` | Stripe | Stripe webhook (raw body). |
| POST | `/payments/sslcommerz/init` | student/parent | Start SSLCommerz (bKash/Nagad/cards) → `gatewayUrl`. |
| POST | `/payments/sslcommerz/ipn` | SSLCommerz | **Server-validated** IPN → marks invoice paid. |

---

## Parents — `/api/parents` *(role: parent)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me/children` | The parent's linked children. |
| GET | `/me/notices` | In-app notices/announcements (`{ items, unread }`). |
| GET | `/me/children/:studentId/dashboard` | Child overview (attendance %, rank, fees). |
| GET | `/me/children/:studentId/grades` | Child grades. |
| GET | `/me/children/:studentId/attendance` | Child attendance history. |
| GET | `/me/children/:studentId/invoices` | Child invoices. |

> Every child route enforces ownership: a student not linked to the parent returns **404**.

---

## Notifications — `/api/notifications`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/broadcast` | staff | Send to a target group via email/SMS/in-app. |
| GET | `/logs` | staff | Delivery log (paginated). |
| GET | `/inbox` | any | In-app inbox (`{ items, unread }`). |
| PUT | `/:id/read` · `/read-all` | any | Mark read. |

---

## AI — `/api/ai` *(rate-limited)*
| Method | Path | Description |
|--------|------|-------------|
| POST | `/report-narrative` | Claude SSE — report-card narrative for a student/term. |
| POST | `/attendance-summary` | AI attendance summary. |
| POST | `/class-insights` | Class performance insights. |
| POST | `/admin-query` | GPT-4o natural-language admin query (JSON). |
| POST | `/generate-practice-questions` | Generate practice questions. |
| POST | `/study-chat` | GPT-4o study assistant (SSE) for students. |

---

## Schools — `/api/schools`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/me` | staff | Current school + branding. |
| PUT | `/me` | school_admin | Update appearance (colors, logo, contact, locale). |

---

## Practice Materials — `/api/practice-materials`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | any | List (`search, classId, subjectId, type, publishedOnly, page, limit`). |
| POST | `/` | teacher/admin | Create material. |
| PUT/DELETE | `/:id` | teacher/admin | Update / delete. |

---

## Audit — `/api/audit` *(role: school_admin / super_admin)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Audit trail of create/update/delete (`page, limit, entity, action`). |

---

## Analytics — `/api/analytics` *(role: school_admin / teacher)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/at-risk` | At-risk students with reasons + `{ summary, thresholds }`. |

---

## Health (no tenant)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ status, uptime, timestamp, version }`. |
| GET | `/` | API metadata. |

---

### Example: parent fetches a child's dashboard
```bash
# 1. Login (stores cookies)
curl -c jar.txt -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' -H 'X-School-Slug: dhaka-model' \
  -d '{"email":"parent@dhaka-model.test","password":"Password123"}'

# 2. List children, then fetch one child's dashboard
curl -b jar.txt -H 'X-School-Slug: dhaka-model' http://localhost:3001/api/parents/me/children
curl -b jar.txt -H 'X-School-Slug: dhaka-model' \
  http://localhost:3001/api/parents/me/children/<studentId>/dashboard
```

For full request/response schemas, use the live **Swagger UI at `/api/docs`**.
