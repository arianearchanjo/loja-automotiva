# AGENTS.md

## Commands

### Backend

#### Lint
From the `backend` directory:
```bash
npm run lint        # ESLint check
npm run lint:fix    # ESLint with auto-fix
```

#### Typecheck
From the `backend` directory:
```bash
npm run typecheck   # tsc --noEmit
```

#### Tests
From the `backend` directory:
```bash
npm test            # vitest run
```

#### Build
From the `backend` directory:
```bash
npm run build       # prisma generate && tsc
```

#### Database
From the `backend` directory:
```bash
npm run db:deploy   # prisma migrate deploy (creates tables)
npm run db:seed     # run seed script (creates admin user)
npm run db:generate # prisma generate
```

### Frontend

#### Typecheck
From the `frontend` directory:
```bash
npm run typecheck   # tsc --noEmit
```

#### Build
From the `frontend` directory:
```bash
npm run build       # tsc && vite build
```

#### Dev
From the `frontend` directory:
```bash
npm run dev         # vite (http://localhost:5173)
```

### Environment

#### Backend `.env` (não é commitado)
```
NODE_ENV=production
DATABASE_URL=<postgresql://...>
BETTER_AUTH_SECRET=<32+ chars>
BETTER_AUTH_URL=https://<backend-vercel-url>
FRONTEND_URL=https://<frontend-vercel-url>
```

#### Frontend `.env` (não é commitado)
Em produção, deixe `VITE_API_URL` vazio — o `vercel.json` proxy encaminha `/api` para o backend.

