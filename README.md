# BalanceVault

BalanceVault is an auditable money-movement application built around account approval, role-based access control, and a verifiable transaction ledger.

## Project overview

Users can request accounts, deposit funds, and transfer money to another approved account. Large transfers are held for administrator approval. Every deposit and transfer records a SHA-256 hash linked to the preceding transaction for that account. Administrators can review account requests, inspect audit events, simulate a ledger amount tamper, and verify ledger integrity.

## Tech stack

- Next.js 16 App Router and React
- TypeScript
- Prisma ORM and MySQL
- NextAuth.js credentials authentication
- Zod request validation
- Upstash Redis and `@upstash/ratelimit`
- Jest, Testing Library, and `next/jest`
- Tailwind CSS

## Architecture

### Ledger hash chain

Transactions are stored with `previousHash` and `currentHash`. A transaction's SHA-256 hash is calculated from its account, transaction data, timestamp, and the previous hash. Transfers also include the receiver account in the hash input. The first transaction for an account uses a fixed all-zero genesis hash.

The admin verification endpoint checks both that each transaction links to the preceding transaction for its account and that its stored hash matches the transaction data. Changing a transaction amount without updating the hash is therefore detected. The Admin page's Tamper action is a demonstration tool that intentionally alters stored transaction data; do not expose it as a normal production operation.

This hash chain provides tamper evidence, not protection against an attacker who can rewrite the database and recompute every hash. Production deployments should additionally restrict database access, maintain backups, and consider externally anchoring ledger checkpoints.

### Authentication and RBAC

NextAuth.js authenticates users using email and password credentials. Passwords are hashed with bcrypt before storage. The authenticated session carries the user's ID and role. Sensitive route handlers enforce authorization on the server; hiding a page or control in the UI is not treated as an access-control boundary.

Registration creates standard users by default. A valid server-side `ADMIN_INVITE_CODE` is required to register an administrator. The first registered user is not automatically made an administrator.

### Rate limiting

Registration and deposits use Upstash's sliding-window limiter, scoped by route and client IP, with a limit of five requests per minute. Configure a trusted reverse proxy to set or sanitize `x-real-ip` / `x-forwarded-for`; do not rely on client-supplied forwarding headers as a trusted identity. Requests are rejected with `429` when limited. For local development, the limiter is bypassed when `UPSTASH_REDIS_REST_URL` is unset. When a Redis URL is configured, a missing token, missing client IP, or unavailable Redis causes the endpoint to fail closed with `503`.

Registration payloads are validated with Zod before database access. Passwords must contain at least six characters; provided phone numbers must contain exactly ten digits.

## Local setup

### Requirements

- Node.js supported by the installed Next.js version
- MySQL
- An Upstash Redis database (REST URL and token)

### Install and configure

```bash
npm install
```

Create a MySQL database, then create a `.env` file in the project root using the variables below. Keep `.env` out of version control.

Generate a NextAuth secret, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate a strong, private admin invite code and share it only with trusted administrators.

Generate the Prisma client and apply the schema to a local development database:

```bash
npx prisma generate
npx prisma db push
```

For production, manage schema changes with reviewed Prisma migrations (`prisma migrate dev` in development and `prisma migrate deploy` during deployment) rather than `db push`.

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---:|---|
| `DATABASE_URL` | Yes | MySQL connection string, such as `mysql://USER:PASSWORD@localhost:3306/balancevault`. URL-encode special characters in credentials. |
| `AUTH_SECRET` | Yes in production | Secret used by NextAuth.js to sign and encrypt authentication tokens. |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST endpoint used for rate-limit state. If unset, rate limiting is bypassed (intended for local development). |
| `UPSTASH_REDIS_REST_TOKEN` | When URL is set | Token for the Upstash Redis REST endpoint. |
| `ADMIN_INVITE_CODE` | Optional | Private code required to register an `ADMIN` user. Without it, admin-code registration is unavailable. |

Use the Upstash REST URL and token from your Upstash database dashboard. Never prefix these secrets with `NEXT_PUBLIC_` or commit their values.

## Tests and checks

Run the Jest suite:

```bash
npm test
```

Run ESLint:

```bash
npm run lint
```

Run the TypeScript checker:

```bash
npx tsc --noEmit
```
