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

## Production integrations

Set secrets in **Vercel → Project → Settings → Environment Variables**. Do not
commit `.env`, paste credentials into chat, or use `NEXT_PUBLIC_` for secrets.
After adding or changing variables, redeploy the project.

Protect the backoffice by setting:

- `ADMIN_PASSWORD`: a long, unique password for the backoffice.
- `ADMIN_SESSION_SECRET`: a random secret with at least 32 characters. Generate
  one locally with `openssl rand -base64 32`.

The backoffice is available at `/admin`; sign in at `/login`. Public booking,
availability, lead submission, and the secret-validated Hotmart webhook remain
available without an admin session.

Configure providers with the variable names in `.env.example`:

- **Hotmart:** create a webhook for approved purchases and refunds pointing to
  `https://YOUR_DOMAIN/api/webhooks/hotmart`. Set the webhook's HOTTOK as
  `HOTMART_WEBHOOK_SECRET`. Duplicate events are ignored by transaction/event.
- **Google Calendar:** enable Calendar API and create OAuth credentials with
  `calendar.events` and `calendar.freebusy` access. Set the client ID, secret,
  refresh token, and calendar ID. Booking creation inserts an event and invites
  the attendee; public availability checks also exclude busy calendar slots.
- **Zoom:** create a Server-to-Server OAuth app with meeting create/read scopes.
  Set its account ID, client ID, and client secret. Booking creation creates a
  real scheduled meeting.
- **WhatsApp:** configure the official Cloud API phone number and a published
  booking-confirmation template with four body parameters, in this order:
  name, session name, date/time, and Zoom link. Set its template name/language.
  Messages are sent only when the person explicitly opts in on the booking
  form.
- **Resend:** verify the sending domain, then configure the API key and a sender
  address on that domain. Booking confirmation emails are sent by the API.
- **Moloni:** authorize the app through Moloni and configure its client ID,
  client secret, and initial refresh token, plus
  `INTEGRATION_TOKEN_ENCRYPTION_KEY`. Generate this encryption key separately
  with `openssl rand -base64 32`. Rotating OAuth tokens are encrypted in
  PostgreSQL. The current connector validates OAuth; it does not issue fiscal
  documents.
- **Meta Conversions API:** configure the Pixel ID, access token, Graph API
  version, test event code, and public site URL. The connection test sends only
  a synthetic event to Meta's Test Events feed. No live conversion or customer
  personal data is sent.

The Integrations page's **Testar ligação** button makes read-only checks, except
Meta, which sends the synthetic test event described above. A green result
means the provider API accepted the test; it does not imply other features such
as invoice issuance are enabled.
