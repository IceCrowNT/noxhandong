# Legacy review dashboard

Archived on 2026-06-10.

This folder contains the original in-memory workflow that accepted two uploads,
analyzed them in the browser-facing API and exported the temporary review
result. The active system now imports bank statements into PostgreSQL, reviews
transactions in `/admin/transactions/review`, and exports operational reports
from database-backed endpoints.

The files are retained for reference only and are intentionally outside active
Next.js routes.
