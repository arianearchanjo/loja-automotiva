# AGENTS.md

## Commands

### Lint
From the `backend` directory:
```bash
npm run lint        # ESLint check
npm run lint:fix    # ESLint with auto-fix
```

### Typecheck
From the `backend` directory:
```bash
npm run typecheck   # tsc --noEmit
```

### Tests
From the `backend` directory:
```bash
npm test            # vitest run
```

### Build
From the `backend` directory:
```bash
npm run build       # prisma generate && tsc
```

### Database
From the `backend` directory:
```bash
npm run db:deploy   # prisma migrate deploy
npm run db:seed     # run seed script
npm run db:generate # prisma generate
```
