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
npm run db:seed
npm run dev
```

Open [http://localhost:3000/setup](http://localhost:3000/setup) to create a local clinic, owner, and clinic manager. Use synthetic local credentials only. The form stores only bcrypt password hashes; it never stores plaintext passwords.

After registration, `npm run db:seed` adds repeatable synthetic clients, explicit client relationships, all meeting types, all billing arrangements, invoices, a non-client payer, and payments. It requires the local setup records and does not add real people. The dashboard starts a family by creating a parent client, then adds children, a second parent, or another family member connected to that parent. Parent type is `MOM`, `DAD`, or `OTHER`.

The Prisma schema in `prisma/schema.prisma` uses one PostgreSQL database with shared tables and explicit clinic tenancy. A user can belong to multiple clinics through `ClinicMembership`, with a role per clinic. Meeting type and billing arrangement belong to each `Meeting`, not to the `Client`, because one client can have different meeting types over time.

The current domain model separates:

- `FamilyAccount`: an internal shared billing identity, not a user-facing relationship concept.
- `Client`: an individual child, parent, or other family member.
- `ClientRelation`: an explicit connection between clients with a `PARENT`, `CHILD`, or `OTHER` relation type.
- `Payer`: an optional payer who may be a client, a relative, or another person.
- `Payment`: money received against a meeting, optionally linked to an invoice.

This means a grandmother can pay for a child's meeting without being registered as a client. The payment still resolves the meeting debt.

## CI

GitHub Actions runs `npm ci`, linting, and a production build on pushes and pull requests targeting `main`. Database credentials are intentionally not required for these checks.

## Roadmap

1. Add authentication and secure sessions.
2. Add server-side `requireClinicMembership` and `requireRole` helpers.
3. Add secure client and family-account editing workflows.
4. Add Morning API integration behind an explicit feature boundary.
5. Add database-level row-level security before production use.
