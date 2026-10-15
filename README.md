# Emam Bukhari Private School ERP System

A comprehensive School ERP system built with Next.js, TypeScript, Drizzle ORM, and PostgreSQL.

## Features

- Student Management (Admission, Profile, Attendance, Health, Documents)
- Staff Management (HR, Attendance, Leave, Payroll, Performance)
- Academic Management (Classes, Subjects, Timetable, Lesson Plans)
- Examination & Assessment (Exams, Marks, Report Cards)
- Fee & Financial Management (Invoicing, Payments, Expenses, Payroll)
- Library Management (Catalog, Issue/Return, Fines)
- Transport Management (Routes, Vehicles, Drivers)
- Hostel Management (Rooms, Boarders, Meals)
- Communication (SMS, Email, Notices, Messages)
- Reports & Analytics (MoE Compliance, Custom Reports)
- Multi-language Support (Dari, Pashto, English)
- Solar Hijri Calendar Integration
- RTL Support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **UI**: shadcn/ui + Tailwind CSS v4
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Configure your database URL in `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/ebps_erp
```

4. Run database migrations:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── (erp)/                  # Main ERP routes
│   ├── layout.tsx         # ERP layout with sidebar
│   ├── page.tsx           # Dashboard
│   ├── students/          # Student management
│   ├── staff/             # Staff management
│   ├── academics/         # Academic management
│   ├── attendance/        # Attendance management
│   ├── exams/             # Examinations
│   ├── finance/           # Financial management
│   ├── library/           # Library management
│   ├── transport/         # Transport management
│   ├── hostel/            # Hostel management
│   ├── communications/    # Communications
│   ├── announcements/     # Announcements
│   ├── reports/           # Reports & analytics
│   └── settings/          # System settings
├── api/                   # API routes
│   ├── auth/              # Authentication
│   ├── students/          # Students API (legacy v1)
│   ├── v2/students/       # Students API (Clean Architecture v2)
│   └── staff/             # Staff API
└── layout.tsx             # Root layout

src/                       # Clean Architecture layers (v2)
├── domain/                # Pure business logic — 0 framework/DB deps
│   ├── entities/          # Student aggregate, Guardian, Address, HealthRecord
│   ├── value-objects/     # AdmissionNumber, TazkiraNumber, Money, DateOfBirth…
│   ├── enums/             # StudentStatus, Gender, SpecialCategory…
│   ├── events/            # StudentEnrolled/Promoted/Transferred/DroppedOut
│   ├── errors/            # DomainError and subclasses
│   ├── repositories/      # Repository ports (interfaces)
│   └── services/          # Domain services (admission number, age calculator)
├── application/           # Use cases — orchestrates the domain
│   ├── ports/             # Driven ports (ILogger, IClock, IEventPublisher…)
│   ├── use-cases/commands/    # Admit/Update/Promote/Transfer/Dropout
│   └── use-cases/queries/     # GetStudent/ListStudents/SearchStudents
├── infrastructure/        # Drivers & adapters
│   ├── persistence/drizzle/   # Drizzle repositories + mappers
│   ├── services/          # UuidIdGenerator, SystemClock, ConsoleLogger,
│   │                      # ConsoleNotificationService, LocalFileStorage…
│   ├── http/presenters/   # StudentPresenter (400/401/403/404/422/500 mapping)
│   ├── http/middleware/   # requireAuth / requirePermission (better-auth + RBAC)
│   └── ioc/               # Composition root (Container)

components/
├── ui/                    # Reusable UI components
├── layout/                # Layout components
├── erp/                   # ERP-specific components
└── *.tsx                  # Feature components

lib/
├── db/                    # Database configuration and schema
├── erp/                   # ERP utilities and navigation
├── auth.ts                # Authentication configuration
├── auth-client.ts         # Auth client for browser
└── utils.ts               # Utility functions
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm lint` - Run ESLint
- `pnpm test` - Run unit + integration tests (node:test via tsx)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm typecheck` - TypeScript check without emit

## Students API (v2 — Clean Architecture)

All endpoints require a better-auth session cookie. RBAC is enforced via the
`staff_roles` table using `students:read` / `students:write` permissions
(the first user of a school auto-bootstraps as `school_admin`). The school
scope comes from the `x-school-id` header, `schoolId` query param, or the
`DEFAULT_SCHOOL_ID` env var, in that order.

| Method | Endpoint                              | Permission       | Description |
| ------ | ------------------------------------- | ---------------- | ----------- |
| GET    | `/api/v2/students`                    | `students:read`  | List (filter by query/province, paginated) |
| POST   | `/api/v2/students`                    | `students:write` | Admit a student (assigns admission number) |
| GET    | `/api/v2/students/search?q=…`         | `students:read`  | Free-text search (admission no / tazkira / name + filters) |
| GET    | `/api/v2/students/:id`                | `students:read`  | Full student read model |
| PATCH  | `/api/v2/students/:id`                | `students:write` | Partial update |
| POST   | `/api/v2/students/:id/promote`        | `students:write` | Promote to next grade |
| POST   | `/api/v2/students/:id/transfer`       | `students:write` | Transfer out (requires reason) |
| POST   | `/api/v2/students/:id/dropout`        | `students:write` | Mark as dropped out (requires reason) |

Responses use a standard envelope: `{ success, data | error, timestamp }` with
HTTP status 200/201, 400 (validation), 401 (unauthenticated), 403 (forbidden),
404 (not found), 422 (domain rule violation), or 500.

## Configuration

The system supports:
- Multi-campus school management
- Dari, Pashto, and English languages
- Solar Hijri and Gregorian calendars
- Afghan Afghani (AFN) currency
- RTL layout for Dari and Pashto

## License

Proprietary - Emam Bukhari Private School
