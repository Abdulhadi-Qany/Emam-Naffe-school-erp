# Clean Architecture — Completion Roadmap

> Status after this pass: **3 of ~15 bounded contexts fully Clean** (Student + Staff + Finance).
> This doc is the executable checklist to reach 100%.

## 1. Target layout (modular monolith)

```
src/
  shared/                  ✅ DONE — Entity/AggregateRoot/ValueObject, EntityId/SchoolId,
                           │         Pagination, IRepository, ISequenceGenerator,
                           │         CommandHandler/QueryHandler, DrizzleSequenceGenerator
  modules/
    staff/                 ✅ DONE — domain/app/infra + StaffModule + v2 routes
    finance/               ✅ DONE — Invoice aggregate + Issue/RecordPayment + v2 routes
    attendance/            ⬜ TODO (template below)
    academics/             ⬜ TODO
    exams/                 ⬜ TODO
    homework/              ⬜ TODO
    library/               ⬜ TODO
    transport/             ⬜ TODO
    hostel/                ⬜ TODO
    inventory/             ⬜ TODO
    hr/                    ⬜ TODO (extends Staff: leave, contracts, recruitment)
    admissions/            ⬜ TODO (extends Student: pipeline, offers, waitlist)
    communications/        ⬜ TODO
    announcements/         ⬜ TODO
    community/             ⬜ TODO
  app-container.ts         ✅ DONE — getAppContainer() wires staff+finance
app/api/v2/
  students/**              ✅ DONE (existing)
  staff/route.ts           ✅ DONE
  finance/invoices/**      ✅ DONE
```

## 2. Per-module checklist (copy for each ⬜)

1. `domain/` — Entity (aggregate root) + Id/Number VOs + Status enum + `XxxNotFoundError` + Created/Updated events + `IXxxRepository` port.
2. `application/` — `CreateXxxCommand/Handler/Response` (validation + sequence + repo + events) + `ListXxxQuery/Handler`.
3. `infrastructure/` — `DrizzleXxxRepository` (ONLY Drizzle import) + `XxxPersistenceMapper` + `XxxPresenter` (success/error envelope) + `XxxModule` (composition).
4. `index.ts` barrels at domain/application/infrastructure/module level.
5. Wire into `src/app-container.ts` (`this.xxx = new XxxModule(deps)`).
6. Thin routes in `app/api/v2/<name>/route.ts` (auth → permission → handler → presenter, ≤40 lines).
7. Unit test: entity invariants + overpayment/duplicate/transition rejections.
8. `npx tsc --noEmit` clean for `src/(shared|modules|app-container)` + `app/api/v2/<name>`.

## 3. Suggested build order (by dependency)

| # | Module | Tables | Depends on |
|---|--------|--------|------------|
| 1 | attendance | attendance, absence_requests | staff, Student |
| 2 | academics | academic_years, terms, grades, sections, classes, subjects, timetable | — |
| 3 | exams | exams, schedules, marks | academics |
| 4 | homework | homework, submissions | academics |
| 5 | library | books, circulation, members | — |
| 6 | transport | routes, vehicles, assignments, attendance | staff |
| 7 | hostel | rooms, residents, discipline, meals | Student |
| 8 | inventory | items, stock_movements, purchase_orders | finance |
| 9 | hr | leave, contracts, recruitment, interviews | staff |
| 10 | admissions | applications, offers, waitlist | Student |
| 11 | communications | messages, templates, campaigns | — |
| 12 | community/events | volunteers, donations, events | finance |

## 4. Rules (never break)

- Domain imports NOTHING from `@/lib`, `drizzle-orm`, `next/`.
- Application imports domain + ports only.
- Only `infrastructure/` imports `drizzle-orm` / `@/lib/db`.
- Routes import container + presenter + middleware only.
- One envelope: `{ success, data, pagination?, error?, timestamp }`.
- All codes via `ISequenceGenerator` (never `Date.now()` / `count(*)`).
- Every mutation publishes domain events via `IEventPublisher`.

## 5. Definition of Done (per module)

`entity+repo+handlers+mapper+presenter+module+container+v2 routes+tests+typecheck green`
