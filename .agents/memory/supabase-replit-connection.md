---
name: Supabase + Replit connection
description: How to connect a Replit project to a Supabase PostgreSQL database without IPv6 errors.
---

Replit's environment does not support IPv6. Supabase's direct connection hostname (`db.<ref>.supabase.co:5432`) resolves to an IPv6 address and will fail with `ENETUNREACH`.

**Rule:** Always use the Supabase **Transaction Pooler** URL for any Replit project.

**How to get it:**
1. Supabase dashboard → click **Connect**
2. Select **Transaction pooler**
3. Copy the URL — format: `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`

**Why:** The pooler endpoint resolves to an IPv4 address, which Replit can reach. The direct connection endpoint resolves to IPv6 only.

**Store it as:** `SUPABASE_DATABASE_URL` secret (Replit controls `DATABASE_URL` and won't let you override it).

**Code change needed in `lib/db/src/index.ts`:**
- Read `process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL`
- Pass `family: 4` and `--dns-result-order=ipv4first` as extra safety measures
