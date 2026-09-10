# Clinic Management

A privacy-first clinic management application built with Next.js, TypeScript, and PostgreSQL.

## Principles

- No passwords, API keys, patient records, or real customer details in Git.
- Use synthetic data for development and automated tests.
- Use `Client` as the generic domain term; scope every clinic-owned record with `clinicId`.
- Check clinic membership and role on the server before accessing tenant data.
- Add audit logging for sensitive actions.

## Local setup

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL in .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

The Prisma schema in `prisma/schema.prisma` uses one PostgreSQL database with shared tables and explicit clinic tenancy. A user can belong to multiple clinics through `ClinicMembership`, with a role per clinic. Meeting type and billing arrangement belong to each `Meeting`, not to the `Client`, because one client can have different meeting types over time.

The current domain model separates:

- `FamilyAccount`: the shared invoice identity for a family.
- `Client`: a child or parent connected to that family account.
- `Payer`: an optional payer who may be a client, a relative, or another person.
- `Payment`: money received against a meeting, optionally linked to an invoice.

This means a grandmother can pay for a child's meeting without being registered as a client. The payment still resolves the meeting debt.

## CI

GitHub Actions runs `npm ci`, linting, and a production build on pushes and pull requests targeting `main`. Database credentials are intentionally not required for these checks.

## Roadmap

1. Add local registration for the clinic owner and clinic manager.
2. Add authentication and secure sessions.
3. Add server-side `requireClinicMembership` and `requireRole` helpers.
4. Add client/family-account creation as a transaction.
5. Add meeting, invoice, payment, and dashboard screens.
6. Add Morning API integration behind an explicit feature boundary.
7. Add database-level row-level security before production use.
