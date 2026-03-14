# Deploy to Vercel

Deploying gives you a stable HTTPS URL (e.g. `https://prodlist-triple.vercel.app`) so you can test the scanner on mobile without tunnels.

## Option A: Deploy from the Vercel website (easiest)

1. Push your code to **GitHub**, **GitLab**, or **Bitbucket** (if not already).
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **Add New** → **Project** and import your repo.
4. Leave the defaults (Framework: Next.js, root: `./`) and click **Deploy**.
5. When it’s done, open the generated URL (e.g. `https://prodlist-triple-xxx.vercel.app`). Use that URL on your phone for the scanner.

## Option B: Deploy from the CLI

1. Install the Vercel CLI (one time):
   ```bash
   npm i -g vercel
   ```

2. From the project root:
   ```bash
   vercel
   ```
   Log in or link your account when asked. Accept the defaults (or set a project name). Vercel will build and give you a URL.

3. For production:
   ```bash
   vercel --prod
   ```

## After deploy

- Your app runs over **HTTPS**, so the camera works on mobile.
- `public/products.ttl` is served at `/products.ttl`; the scanner and graph use it from the client.
- No server or tunnel needed; share the Vercel URL and open it on any device.
