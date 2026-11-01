// The Worker: one deploy serves every sold site by domain. Routes live in router.js (shared contract, org/plan.md).
import { createApp } from "./router.js";
import { adminApp } from "./admin/index.js";             // owner-admin
import { refreshReviews } from "./reviews/index.js";     // owner-admin
import { stripeWebhook, billingSweep } from "./billing/index.js"; // billing-desk
import { deskApp } from "./desk/index.js";               // billing-desk

export default createApp({ adminApp, refreshReviews, stripeWebhook, billingSweep, deskApp });
