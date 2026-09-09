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

## CI

GitHub Actions runs `npm ci`, linting, and a production build on pushes and pull requests targeting `main`. Database credentials are intentionally not required for these checks.

## Roadmap

1. Add authentication and secure sessions.
2. Add server-side `requireClinicMembership` and `requireRole` helpers.
3. Add clinic invitations and staff management.
4. Add appointments and audit-log screens.
5. Add database-level row-level security before production use.
