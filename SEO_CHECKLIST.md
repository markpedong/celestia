# SEO Checklist

## Implemented

- Root metadata with title template, description, keywords, authorship, icons, Open Graph, and Twitter card data.
- Route metadata for Home, Explore, Latest Posts, Top Posts, Community, Post, and Profile pages.
- Canonical URLs for public indexable pages.
- Dynamic social preview image selection for communities, posts, and profiles.
- `/robots.txt` with public crawl rules and sitemap reference.
- `/sitemap.xml` with static routes plus communities, posts, and user profiles.
- `/manifest.webmanifest` for app install metadata and browser presentation.
- `.env.example` with the public site URL required for correct absolute metadata URLs.

## Before Launch

- Set `NEXT_PUBLIC_SITE_URL` to the production domain, for example `https://celestia.example.com`.
- Confirm `public/images/celestia-reference.png` is the approved default social preview image.
- Add production analytics if the client requires reporting.
- Verify each important page has real content, readable headings, and approved imagery.
- Submit the sitemap in Google Search Console and Bing Webmaster Tools.
- Test social cards with LinkedIn Post Inspector, Facebook Sharing Debugger, and X Card Validator after deployment.
