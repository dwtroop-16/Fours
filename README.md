# FOURS

Automated media buying for affiliate marketers.

FOURS is a buying desk that connects affiliate offers, ad campaigns, S2S postbacks, and a rules engine that pauses losers, cuts bleeders, and scales winners.

## What this MVP includes

- **Offers & campaigns** — seeded Meta / Google / TikTok campaigns with spend and conversion history
- **Rules engine** — CPA / ROI thresholds with lookback windows, min-spend guards, and cooldowns
- **Postback ingest** — `GET/POST /api/postback` for network S2S conversions
- **Platform adapters** — mock Meta / Google / TikTok sync (ready to swap for real APIs)
- **Buying desk UI** — 24h performance, rule ledger, simulate + evaluate controls

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then launch the buying desk.

```bash
npm run test:rules   # pure rule comparator tests
npm run build        # production build
```

## Desk workflow

1. Open `/dashboard`
2. **Simulate losers** (or winners) to push metrics
3. **Run rules now** — pause / scale / reduce budgets and sync to mock adapters
4. Fire a real postback:

```text
GET /api/postback?campaign_id=camp_meta_lean_broad&click_id=test123&payout=45
```

## Architecture

| Layer | Role |
| --- | --- |
| `src/lib/types.ts` | Domain model |
| `src/lib/store.ts` | File-backed demo store (`.data/store.json`) |
| `src/lib/rules/` | Condition compare + evaluation / actions |
| `src/lib/platforms/` | Ad network adapter interface + mocks |
| `src/app/api/*` | Overview, postback, simulate, evaluate, reset |

## Next steps for production

- Persist to Postgres (Neon) instead of `.data/`
- OAuth + real Meta Marketing / Google Ads / TikTok Marketing API writes
- Per-adset / creative level automation
- Cron-scheduled rule evaluation (Vercel Cron)
- Multi-tenant auth and audit log
