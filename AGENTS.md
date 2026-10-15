# Architecture rules

- New-quote photos remain browser-local drafts until the quote is saved, then use the existing private quote-attachments storage and records so detail, public link and PDF share the same attachments.
- Generate landing-page example PDFs and previews with the shared quote renderer and embedded logo assets so examples retain the application's current document design and work offline.
- Quote PDFs use embedded Latin Poppins/Inter fonts and the online quote's service-row and primary/accent colour roles, with print-only spacing for A4 pagination so exports stay visually consistent offline.- Quote presentation templates (layout + extras) live in company_snapshot and per-service `details` in services JSON, so the public RPC and PDF read them without schema changes.
