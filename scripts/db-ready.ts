import { ensureSchema, usingNeon } from "../src/lib/db/client";
import { listCampaigns, listOffers, resetStore } from "../src/lib/store";

async function main() {
  await ensureSchema();
  await resetStore();
  const offers = await listOffers();
  const campaigns = await listCampaigns();
  console.log(
    JSON.stringify(
      {
        ok: true,
        database: usingNeon() ? "neon" : "pglite",
        offers: offers.length,
        campaigns: campaigns.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
