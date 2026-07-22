# Seniorita

Seniorita is a small business selling nature-inspired, private-labeled rings and bracelets. This repo is the admin/management app for running it — login, dashboard, item and category catalog, finance, and settings. It's also a demo/learning project for practicing Git and GitHub workflows alongside real development.

## Stack

- **Frontend:** React via Next.js App Router
- **Backend:** Next.js API routes + Proxy (`src/proxy.ts`, this Next.js version's replacement for `middleware.ts`)
- **Database:** SQLite-compatible via Prisma ORM (driver adapter: `@prisma/adapter-libsql`) — a local file for development, [Turso](https://turso.tech) for production
- **Charts:** [Recharts](https://recharts.org) (Finance page)
- **Language:** TypeScript
- **Linting:** ESLint

## Getting Started

```bash
npm install
npm run db:migrate   # creates the SQLite database and applies the schema
npm run db:seed       # inserts 5 sample categories, 15 items, sample transactions, and an owner + staff account
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to a login page. Sign in with the seeded owner account:

- **Email:** `admin@seniorita.com`
- **Password:** `password`

A seeded staff account is also available (`staff@seniorita.com` / `password`) to try the limited role — see "Roles" below.

(These are seeded defaults — changing your name, email, password, or business details on the Settings page updates the account you actually log in with.)

After logging in you'll land on the dashboard shell (Home / Dashboard / Items / Categories / Finance / Settings).

Other scripts:

```bash
npm run build       # production build
npm run start        # run the production build
npm run lint          # run ESLint
npm run db:studio    # browse/edit the database in Prisma Studio
```

## Project Structure

```
prisma/
  schema.prisma       # Category, Item, and Transaction models
  seed.ts              # sample data (5 categories, 15 items, sample transactions)
src/
  app/
    login/             # public login page
    (app)/              # protected dashboard shell (Home/Dashboard/Items/Categories/Finance/Activity Log/Settings)
    api/auth/           # login/logout API routes
  lib/
    auth.ts             # session cookie verification + getCurrentUser()
    session.ts           # signed session token create/verify
    password.ts          # password hashing (shared by auth + user creation)
    roles.ts              # owner/staff role constants
    users.ts              # staff-account validation
    activityLog.ts        # logActivity() helper, called from every mutating API route
    db.ts                # Prisma client singleton
    items.ts             # helpers for the Item.images JSON field
    csv.ts                # dependency-free RFC4180-style CSV parser
    itemsImport.ts         # per-row validation for CSV bulk import
    settings.ts          # Settings (business profile) validation
  proxy.ts               # route protection (redirects unauthenticated users to /login)
```

## Database

The database is SQLite, stored locally as `dev.db` (gitignored — each machine has its own copy). Schema changes live in `prisma/schema.prisma`, and migrations are tracked in `prisma/migrations/` (committed to git).

- **Category**: `id`, `name`, `gender` (men/women/unisex), `description`, `createdAt`
- **Item**: `id`, `name`, `category` (FK), `gender`, `type` (ring/bracelet), `price`, `material`, `natureTheme`, `description`, `images` (JSON array of image paths), `stock`, `isActive`, `createdAt`
- **Transaction**: `id`, `type` (sale/expense), `amount`, `description`, `date`, `item` (optional FK), `createdAt` — see "Finance scope" below
- **User**: `id`, `name`, `email` (unique), `passwordHash`, `role` (owner/staff), `createdAt` — login accounts. Login checks credentials against this table, so changing your password on the Settings page actually takes effect.
- **Settings**: single-row (id 1) table for the business profile, shared by whoever can see it — `businessName`, `logoUrl` (a data URL), `updatedAt`. Also holds storefront-facing preferences (`currency`, `taxRatePercent`, `defaultGenders` JSON array, `maintenanceMode`) — these don't drive any live behavior yet since there's no public storefront, but the Settings page lets you configure them ahead of one existing.
- **ActivityLog**: `id`, `user` (optional FK, SET NULL if the account is later removed), `userName` (a snapshot, so entries stay readable after that), `action` (created/edited/deleted), `entityType` (category/item/settings/user), `entityId`, `timestamp` — see "Activity log" below.

After pulling changes that touch `prisma/schema.prisma`, re-run `npm run db:migrate` to apply them to your local database.

### Roles

Decided in TICKET-118: two roles, **owner** and **staff**. Staff can view/edit Items and Categories, but not Finance or Settings — this is enforced in the API routes themselves (`/api/transactions`, `/api/settings`, `/api/users` all check the signed-in user's role and return 403 for staff), not just by hiding the nav links, so it holds even if someone calls those endpoints directly. The session cookie only carries a signed user ID; the role is always looked up fresh from the database on each request; it's never trusted from anything the client sends.

Owners manage staff accounts from the Team section at the bottom of Settings (add/remove; an owner account can't be removed, including your own).

### Activity log

Added in TICKET-119. Every mutating API route (create/edit/delete on Categories and Items, saving Settings, adding/removing a staff account) calls `logActivity()` after the change succeeds, recording who did it, what kind of action, what type of thing, and its id. The Activity Log page (owner-only, same 403-enforced pattern as Finance/Settings) lists these, filterable by user and date range. It starts empty on a fresh install/reseed rather than being pre-populated with fake history.

### Bulk import (CSV)

Added in TICKET-120. The Items page has an "Import CSV" button leading to `/items/import`, which documents the required column format (`name`, `category`, `gender`, `type`, `price` required; `material`, `natureTheme`, `description`, `stock`, `isActive` optional) on the page itself. `category` must match an existing category's name (case-insensitive) — the importer doesn't create categories.

Import is two steps: `POST /api/items/import` parses and validates the CSV without writing anything, returning a per-row report (valid/error + reason); the page shows that report and only then offers a "Import N valid row(s)" button, which calls `POST /api/items/import/commit`. The commit endpoint re-validates from scratch (never trusts the client-side report) and only inserts the rows that are still valid, skipping the rest — a bad row never blocks the good ones. Each imported item is logged via `logActivity()` like any other created item. Any signed-in user (owner or staff) can import, same as creating items one at a time.

### Finance scope

Decided in TICKET-102: Finance tracks **sales and expenses**, not inventory value (already shown on the Dashboard) and not orders/carts (there's no storefront yet, so sales are logged manually rather than generated by checkout). One `Transaction` model covers both, distinguished by `type`. A transaction can optionally reference a single catalog item; multi-item orders are out of scope until an actual storefront exists to generate them.

The Finance page shows total inventory value, total sales, and total expenses (with a date-range filter) plus a sales-vs-expenses-by-month chart, backed by `GET /api/transactions` (`?from=&to=` filters by date).

### Production database (Turso)

Local development uses a SQLite file (`dev.db`), which doesn't work on Vercel's serverless filesystem. Production uses [Turso](https://turso.tech) instead — same SQLite dialect, just hosted, so no schema changes are needed.

1. Create a free Turso database (via the Turso dashboard or CLI)
2. Get its URL and an auth token
3. Combine them into one connection string: `libsql://your-db-name.turso.io?authToken=your-auth-token`
4. Set that as the `DATABASE_URL` environment variable in Vercel's project settings (not in a committed file)
5. Apply the schema and sample data once, locally, with that same `DATABASE_URL` set:
   ```bash
   npm run db:migrate:turso   # applies any migrations not yet on Turso (Prisma's own migrate command can't parse libsql:// URLs, so this applies the migration SQL directly via the libSQL client instead)
   npm run db:seed:turso        # inserts the sample categories, items, and transactions
   ```
   `DATABASE_URL` can be set inline (`DATABASE_URL="..." npm run db:migrate:turso`), or by creating a gitignored `.env.turso` file in the project root with one line, `DATABASE_URL=libsql://your-db-name.turso.io?authToken=your-auth-token` — useful if your terminal mangles long tokens passed inline.

## Git & GitHub Workflow (quick reference)

Basic loop for making a change:

```bash
git checkout -b my-feature   # create a branch for your change
# ...edit files...
git status                   # see what changed
git add <file>                # stage specific files
git commit -m "Describe the change"
git push -u origin my-feature
```

Then open a Pull Request on GitHub to merge `my-feature` into the main branch. This keeps the main branch stable and gives you a history of reviewed changes — good practice even on solo/demo projects.

Useful commands while learning:

```bash
git log --oneline     # see commit history
git diff               # see unstaged changes
git branch             # list branches
```

## Deploy

The easiest way to deploy this app is [Vercel](https://vercel.com/new), from the creators of Next.js. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other options.
