<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/070fbf82-d6f3-4793-b1cc-dda0e6405be8

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`
3. Run the app:
   `npm run dev`

## Forms, tracking and the back office

Forms are captured step by step in Supabase (contact details first, so staff
can follow up with anyone who stops part-way), visits are tracked first-party,
and emails go out through Resend. Staff work from a separate back-office app:

```bash
npm run dev:admin     # http://localhost:3001
npm run build:admin   # dist-admin/, deployed on its own address
```

Setup steps are in [docs/BACKEND.md](docs/BACKEND.md).

## Photo credits

Hero photography is from [Pexels](https://www.pexels.com/license/) (free to use,
attribution appreciated):

- Yoruba mother and sons — [ab-pixels-ng](https://www.pexels.com/photo/38600702/)
- Igbo traditional wedding — [detty-images](https://www.pexels.com/photo/37939838/)
- Father and sons — [planeteelevene](https://www.pexels.com/photo/2305212/)
- Welcoming a newborn — [sanusi-jabir](https://www.pexels.com/photo/38477579/)
