# Testing the scanner on mobile

The barcode/QR scanner needs a **secure context** (HTTPS or localhost). Plain `http://` from your phone to your computer’s IP is not secure, so the camera won’t be allowed. Use one of the options below.

---

## Option 1: HTTPS dev server (same Wi‑Fi)

1. **Start the dev server with HTTPS**
   ```bash
   npm run dev:https
   ```
   The server listens on `0.0.0.0:3000`, so it’s reachable from other devices on your network.

2. **Find your computer’s IP**
   - macOS: System Settings → Network → Wi‑Fi → Details, or run `ipconfig getifaddr en0`
   - Windows: `ipconfig` → look for IPv4 (e.g. 192.168.1.100)

3. **On your phone** (same Wi‑Fi as the computer)
   - Open: `https://YOUR_IP:3000` (e.g. `https://192.168.1.100:3000`)

4. **Accept the certificate warning**
   - The cert is self‑signed, so the browser will warn. Choose “Advanced” → “Proceed to … (unsafe)” or similar so the page loads. Then the camera should work.

---

## Option 2: Tunnel (works from anywhere)

Use a tunnel so your phone gets a real HTTPS URL. No cert warning, works even off your home network.

1. **Start the app** (normal or HTTPS):
   ```bash
   npm run dev
   ```

2. **Run a tunnel** in another terminal. Examples:
   - **ngrok:** `npx ngrok http 3000`  
     → Use the `https://….ngrok-free.app` URL on your phone.
   - **Cloudflare:** `npx cloudflared tunnel --url http://localhost:3000`  
     → Use the `https://….trycloudflare.com` URL.

3. **On your phone**, open the tunnel’s HTTPS URL. Camera should work without any cert step.

---

## If the camera still doesn’t work

- Confirm the page URL starts with **https://** (or is localhost on the same machine).
- In the browser on the phone, allow camera permission when prompted.
- Try in a private/incognito tab in case an old “block” is cached.
