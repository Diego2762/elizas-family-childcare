# Eliza's Family Childcare, website

Bilingual (English and Spanish) static website for Eliza's Family Childcare,
a licensed family child care home in Blossom Hill, San Jose, CA 95118.

## Status

Provisional preview. The site is deployed on a temporary Vercel address while
the client's own domain is being purchased. Search engine indexing is blocked
on purpose from `vercel.json` so the temporary address never competes with the
real domain later.

**When the real domain is connected, delete the `X-Robots-Tag` header block in
`vercel.json` so the site can be indexed.**

## Stack

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework.
Open `index.html` in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8091
```

## Structure

```
/                     English pages
/es/                  Spanish pages, an exact mirror of the English ones
/assets/css/          One shared stylesheet
/assets/js/           One shared script
/assets/img/          Images, logo, certificate scans
```

Ten pages per language: home, about, programs, infant care, toddler care,
preschool, tuition, certificates and photos, FAQ, contact.

## Conventions

- The stylesheet and script are linked with a `?v=N` cache-busting version.
  **Bump `N` in all 20 HTML files whenever the CSS or JS changes**, otherwise
  browsers keep serving the old file.
- The header and footer are repeated in every HTML file, so navigation changes
  are a 20 file edit.
- Section backgrounds alternate `bg-cream` and `bg-sand`. Inserting or moving a
  section means re-flipping every section after it.
- No em dashes or en dashes in any client-facing copy, English or Spanish.
- Spanish pages mirror the English ones exactly. Only the language changes.

## Business details

These appear across the site, in the footer and in the JSON-LD schema. Keep
them identical everywhere, they need to match the Google Business Profile.

- Eliza's Family Childcare
- 1457 Blossom Hill Rd, San Jose, CA 95118
- (408) 335-9357
- info@elizaschildcare.com
- Monday to Friday, 7:30 AM to 5:30 PM
- Ages 0 to 5, licensed for 14 children

## Pending

- Replace the two sample certificates in `/assets/img/certs/` with the real scans.
- Connect the client's domain and remove the indexing block.
- SEO and Google Business Profile setup.
