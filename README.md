# Seniorita

A minimal full-stack starter built with [Next.js](https://nextjs.org) (TypeScript, App Router). It exists as a demo/learning project for practicing Git and GitHub workflows alongside real development.

## Stack

- **Frontend:** React via Next.js App Router (`src/app/page.tsx`)
- **Backend:** Next.js API route (`src/app/api/hello/route.ts`)
- **Language:** TypeScript
- **Linting:** ESLint

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the homepage fetches a message from the `/api/hello` backend route, showing the frontend and backend talking to each other.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # run ESLint
```

## Project Structure

```
src/app/
  page.tsx          # homepage (frontend)
  layout.tsx         # root layout
  api/hello/route.ts # example backend API route
```

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
