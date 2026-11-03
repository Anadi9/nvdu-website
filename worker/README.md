# Worker: visit requests and gifts

A Cloudflare Worker for the site's `/api/*` routes. It is a stub until the family has a Razorpay account and an email to receive visit requests; without those settings every endpoint answers `503` with a plain message, never a fake success.

| Route | From | Does |
|---|---|---|
| `POST /api/visit` | the ask-to-come form on `/visit/` | checks name and email (same messages as the page), emails the family |
| `POST /api/gift/order` | the review step on `/support/` | creates a Razorpay order in rupees, with the gift's purpose, name, dedication and "show my name" in its notes |
| `POST /api/gift/webhook` | Razorpay | verifies the signature, then emails the receipt |

To connect (when ready): set `FAMILY_EMAIL` in `wrangler.toml`, add the three Razorpay secrets with `wrangler secret put`, add an email binding as `MAILER`, then point the two pages' buttons at these routes. Test with Razorpay **test-mode** keys first. Test locally: `node test.mjs`.
