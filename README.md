# Marina Loyola

## Database setup

The application uses PostgreSQL and Drizzle ORM. Configure `DATABASE_URL` in
your local `.env` and in the Vercel environment settings. Use the Neon
pooled connection string for the application; keep credentials out of Git.

```sh
npm install
npm run db:generate
npm run db:migrate
```

Commit generated files in `drizzle/` with each schema change. To release a
schema change, run `npm run db:migrate` against the production database from a
trusted environment before deploying the application version that requires it.
Do not use `drizzle-kit push` against production; reviewed migrations provide a
repeatable, auditable rollout.

The demo seed clears tables and inserts sample data. It is only allowed outside
production and requires explicit opt-in:

```sh
ALLOW_DESTRUCTIVE_SEED=true npm run db:seed
```

Never run the demo seed against a database containing real data.
