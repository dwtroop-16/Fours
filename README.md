# FOURS

Automated media buying for affiliate marketers.

FOURS is a buying desk that connects affiliate offers, ad campaigns, S2S postbacks, and a rules engine that pauses losers, cuts bleeders, and scales winners — then syncs status/budget to ad platforms.

## What’s included

- **Postgres-backed store** — Neon when `DATABASE_URL` is set; embedded **PGlite** locally otherwise
- **Offers & campaigns** — seeded Meta / Google / TikTok campaigns with spend and conversion history
- **Rules engine** — CPA / ROI thresholds with lookback windows, min-spend guards, and cooldowns
- **Cron evaluation** — `GET /api/cron/evaluate-rules` every 5 minutes via `vercel.json`
- **Meta Marketing API sync** — pause/resume + daily budget push when `META_ACCESS_TOKEN` is set (mock mode otherwise)
- **Postback ingest** — `GET/POST /api/postback`
- **Buying desk UI** — 24h performance, rule ledger, platform sync log, simulate + evaluate controls

## Quick start

```bash
cp .env.example .env.local
npm install
npm run db:ready   # create tables + seed (PGlite under .data/fours-pg)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then launch the buying desk.

```bash
npm run test:rules
npm run build
```

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (optional locally) |
| `CRON_SECRET` | Bearer token required by `/api/cron/evaluate-rules` |
| `META_ACCESS_TOKEN` | Meta Marketing API user/system token |
| `META_AD_ACCOUNT_ID` | e.g. `act_123` (informational in desk UI) |
| `META_GRAPH_VERSION` | Graph API version (default `v22.0`) |
| `META_BUDGET_OBJECT_<campaignId>` | Optional ad set id when budget isn’t on the campaign |

## Desk workflow

1. Open `/dashboard`
2. **Simulate losers** (or winners) to push metrics
3. **Run rules now** — pause / scale / reduce budgets and sync to Meta (or mock adapters)
4. Fire a real postback:

```text
GET /api/postback?campaign_id=camp_meta_lean_broad&click_id=test123&payout=45
```

5. Cron (production): Vercel hits `/api/cron/evaluate-rules` every 5 minutes with `Authorization: Bearer $CRON_SECRET`

## Meta live sync

1. Create a Meta system user / long-lived token with `ads_management`
2. Set `META_ACCESS_TOKEN` (and optionally `META_AD_ACCOUNT_ID`)
3. Set each Meta campaign’s `externalId` to the Meta campaign ID (CBO) or ad set ID
4. Run rules — status `ACTIVE`/`PAUSED` and `daily_budget` (cents) are POSTed to Graph API

Without a token, Meta stays in **mock** mode and writes to the platform sync log only.

## Architecture

| Layer | Role |
| --- | --- |
| `src/lib/db/` | Drizzle schema + Neon / PGlite client |
| `src/lib/store.ts` | Async repository over Postgres |
| `src/lib/rules/` | Condition compare + evaluation / actions |
| `src/lib/platforms/` | Ad network adapters (Meta live + mocks) |
| `src/app/api/cron/` | Scheduled rule evaluation |
| `vercel.json` | Cron schedule |

## Production checklist

- [ ] Provision Neon (`DATABASE_URL`) on the Vercel project
- [ ] Set `CRON_SECRET` and confirm cron invocations are authorized
- [ ] Connect Meta token and map `externalId` values to real campaign/ad set IDs
- [ ] Add auth / workspaces before multi-operator use
