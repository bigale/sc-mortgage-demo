# Mortgage Calculator — SmartClient on Cloudflare Pages

A 40-line standalone HTML page demonstrating a SmartClient app deployed to Cloudflare Pages with **no build, no bundler, no extension** — just raw HTML loading SmartClient modules from the same origin.

## What's here

- `index.html` — the calculator (≈40 lines of JS using `isc.VLayout`, `isc.DynamicForm`, `isc.Label`)
- `smartclient/` — the minimum SmartClient subset needed to render: `ISC_Core`, `ISC_Foundation`, `ISC_Containers`, `ISC_Forms`, plus the Tahoe skin

## First-load wire size

| Format | Size |
|---|---|
| Raw | 4.6 MB |
| Gzip | 1.27 MB |
| Brotli (Cloudflare default) | **~1.0 MB** |

Cached at the edge after first request from any region. Subsequent visits are browser-cached.

## Deploy

This repo is built for direct deployment to Cloudflare Pages — no build step.

In the Cloudflare Pages dashboard:
- **Framework preset:** None
- **Build command:** *(leave empty)*
- **Build output directory:** `/`
- **Root directory:** `/`

That's it. CF serves the files as-is with brotli compression applied automatically.

## Local preview

```
python3 -m http.server 8765
# open http://localhost:8765/
```

## License

The SmartClient runtime included here is LGPL v14.1p (Isomorphic Software). The page code is MIT.
