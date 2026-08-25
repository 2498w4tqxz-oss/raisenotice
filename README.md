# RaiseNotice

NYC rent-increase notice, filled. $19.

Fills NY RPL 226-c and Good Cause Eviction 231-c. No account. One PDF.

## Demo

Open http://127.0.0.1:3001 and click Try sample: 2-family in Astoria.
Preview: 9.09%, 226-c required, 90-day, send-by, GCE not covered.
Pay 19 dollars. Without Stripe, confirm DEMO PAY. Success auto-downloads the PDF.
Start from blank opens /form. Incomplete notices cannot be paid.

## Env
NOTICE_SECRET. Optional Stripe key. NEXT_PUBLIC_APP_URL=http://127.0.0.1:3001

## Run
Port 3001 only.
