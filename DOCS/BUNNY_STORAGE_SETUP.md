# Bunny Storage (multimedia)

## Table of contents

- [What it is](#what-it-is)
- [Quick setup](#quick-setup)
- [Environment variables](#environment-variables)
- [CDN](#cdn)
- [Testing uploads](#testing-uploads)
- [References](#references)

## What it is

[Bunny.net](https://bunny.net/) **Storage** holds uploaded lesson media; a **Pull Zone** (CDN) can serve files from an edge URL. The app uses env-based credentials; see multimedia routes under `src/app/api/` (e.g. lesson multimedia and editor images).

## Quick setup

1. Create a Bunny account and a **Storage zone** (note region code, e.g. `de`, `ny`).
2. Copy the **API key** (Storage zone → FTP & API).
3. Add variables to **`.env`** or **`.env.local`** (see below).
4. (Optional) Create a **Pull Zone** pointed at the storage zone for CDN URLs.

## Environment variables

Align names with **`.env.example`** in the repo. Typical pattern:

```bash
# Match `.env.example` and src usage
BUNNY_STORAGE_API_KEY="your-api-key"
BUNNY_STORAGE_REGION="de"
BUNNY_STORAGE_BUCKET="your-storage-zone-name"
```

Also set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` as documented in the root README.

## CDN

After attaching a Pull Zone, media URLs may use the `*.b-cdn.net` host for faster delivery. Configure any **CSP** / allowed image domains if you lock down headers.

## Testing uploads

1. `npm run dev`
2. Open a course as an author and edit a lesson with **Multimedia** content type (or the editor upload flow your UI exposes).
3. Confirm the file appears in the Bunny dashboard and loads in the browser.

## References

- [Bunny Storage docs](https://docs.bunny.net/docs/storage)
- Security and env overview: [SECURITY.md](./SECURITY.md)
