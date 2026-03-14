# Project docs

All project documentation and learned knowledge lives here. **Nothing goes in the project root** except code and config; docs stay in `docs/`.

## Structure

- **`knowledge-graph/`** — Knowledge graph output files (e.g. exports, dumps, schemas).
- **`learned.md`** — Running notes on everything we've learned (conventions, decisions, gotchas).
- **`troubleshooting.md`** — Quick reference for common errors and fixes (links to learned.md).
- **`PRD-tabulas-dpp-product-graph-explorer.md`** — Product requirements for the Tabulas DPP Product Graph Explorer app.
- **`PRD-qr-scanner.md`** — Product requirements for the QR/Barcode Scanner feature (scan → GTIN → SPARQL → graph).
- **`deploy-vercel.md`** — How to deploy to Vercel (Git or CLI); HTTPS so scanner works on mobile.
- **`mobile-testing.md`** — Testing the scanner on a phone (HTTPS dev server, tunnel).

## Rules

- Keep this folder clean and organized.
- Put new docs and knowledge-graph outputs only in `docs/` (or subfolders).
- Never add documentation or learned-knowledge files to the project root.
