# SaaS Starter..

Production-ready SaaS starter with Next.js (App Router), TypeScript, shadcn/ui, Prisma, Neon Postgres, Clerk auth, and Cloudflare R2 storage.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **Prisma** + **Neon** (Postgres)
- **Clerk** (auth)
- **Cloudflare R2** (S3-compatible file storage)

## Folder structure

```
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── files/[...path]/route.ts   # Signed download URL proxy
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── file-list.tsx
│   │   │   └── upload-form.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── use-toast.ts
│   ├── lib/
│   │   ├── actions/
│   │   │   └── files.ts    # Server actions: upload, delete
│   │   ├── prisma.ts       # Prisma singleton
│   │   ├── r2.ts           # R2 client, validation, presigned URLs
│   │   └── utils.ts
│   └── middleware.ts       # Clerk auth, protected routes
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Setup

The app uses dynamic rendering, so `npm run build` succeeds without environment variables. For local dev and production you must set the variables below.

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

- **Database (Neon)**  
  - [Neon](https://console.neon.tech): create a project, copy **Connection string** and **Direct connection** (for migrations).  
  - Set `DATABASE_URL` and `DIRECT_URL`.

- **Clerk**  
  - [Clerk](https://dashboard.clerk.com): create an application, then **API Keys**.  
  - Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.  
  - Configure **Paths**: Sign-in URL `/sign-in`, Sign-up URL `/sign-up`, After sign-in/sign-up → `/dashboard`.

- **Cloudflare R2** ([API docs](https://developers.cloudflare.com/r2/api/))  
  - [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Create bucket.  
  - R2 → **Manage R2 API Tokens** → Create API token (Object Read & Write). Copy **Access Key ID** and **Secret Access Key** — these are the S3-compatible credentials ([tokens guide](https://developers.cloudflare.com/r2/api/tokens/)).  
  - Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`. Endpoint is `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.  
  - Optional: `R2_PUBLIC_URL` if the bucket has a public custom domain.

### 3. Database

```bash
npm run db:generate
npm run db:push
# or, for versioned migrations:
npm run db:migrate
# Optional: seed sample users, groups, and pages (requires tsx: npm i -D tsx)
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then use the dashboard to upload and delete files.

## Features

- **Landing** (`/`): public; sign-in / sign-up / dashboard links.
- **Auth**: Clerk sign-in/sign-up; middleware protects `/dashboard` and API routes.
- **Users**: Profile page with name, email, phone, and profile picture (R2). User sync from Clerk on first load.
- **Groups**: CRUD with hierarchical parent/child; group logo (R2); group tree UI; membership (many-to-many).
- **Pages**: Per-group pages with cover photo (R2), title, description, parent/child group logo snapshots.
- **REST API**: `GET /api/users/me`, `GET /api/groups`, `GET /api/groups/[id]`, `GET /api/groups/[id]/pages`. Image upload: `POST /api/upload/image` (FormData: file, prefix, identifier).
- **Dashboard** (`/dashboard`): overview; **Groups** and **Profile** in nav; group detail shows members (with names/avatars), child groups, and pages.
- **File upload**: server action + API; images for profile, group logo, page cover; size/type validation and toasts.
- **File download**: stored URL points to `/api/files/<key>`; API streams from R2 when `R2_PUBLIC_URL` is not set.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push`     | Push schema (no migration files) |
| `npm run db:migrate`  | Run migrations           |
| `npm run db:studio`   | Open Prisma Studio       |
| `npm run db:seed`     | Seed users, groups, pages (requires `tsx`: `npx tsx prisma/seed.ts`) |

## Notes

- User records are created on first upload (Clerk `userId` → `User.clerkUserId`).
- File metadata is stored in Postgres; blobs are in R2. Deletes remove both.
- Without R2 env vars, uploads return a clear error; app still runs for auth and DB.
