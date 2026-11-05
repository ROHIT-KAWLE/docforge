# DocForge Personal Deployment Guide

This guide explains how to deploy **DocForge** as your personal universal document toolbox across your PC, laptop, phone, and tablet with **zero recurring subscription costs, 100% privacy, and master password security**.

---

## Architecture Overview

* **Unified Server Engine**: FastAPI serves both the REST API and the compiled React PWA single-page application on port `8000`.
* **Zero Cloud Dependencies**: All PDF processing, image formatting, compression, and conversions happen locally on your hardware.
* **Master Password Protection**: The application is protected by a hashed credential gateway (`DocForgeMaster2026!` default) stored in `storage/credentials.json`.
* **Installable PWA**: Runs full-screen with offline-capable UI on Android, iOS (iPhone/iPad), macOS, and Windows.

---

## Method 1: Local Network / Home Wi-Fi (Simplest & Fast)

Use this method to run DocForge on your primary Windows PC and access it from any phone, laptop, or tablet on your home Wi-Fi network.

### Step 1: Start DocForge
You have two launch options:
* **Interactive Mode (Shows logs)**: Double-click `scripts\run_production.bat`
* **Silent Background Mode (Runs hidden)**: Double-click `scripts\start_silent.vbs`
* **Stop Server**: Double-click `scripts\stop_docforge.bat`

### Step 2: Auto-Start with Windows (Optional)
To have DocForge automatically launch silently in the background whenever you turn on your PC:
1. Double-click `scripts\setup_windows_startup.bat`.
2. It adds a background launcher into your Windows Startup folder.

### Step 3: Allow Port 8000 through Windows Firewall
To allow other devices on your home Wi-Fi to reach port 8000, run this single command in **PowerShell as Administrator**:
```powershell
New-NetFirewallRule -DisplayName "DocForge Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### Step 4: Find Your PC's Local IP Address
In PowerShell or Command Prompt, run:
```cmd
ipconfig
```
Look for **IPv4 Address** under your active Wi-Fi or Ethernet adapter (e.g., `192.168.1.45`).

### Step 5: Connect & Install PWA on Your Phone / Tablet
1. Connect your phone or tablet to the same Wi-Fi router.
2. Open your mobile browser and navigate to:
   ```
   http://192.168.1.45:8000
   ```
3. Enter your Master Password.
4. **Install as App**:
   * **iPhone / iPad (Safari)**: Tap the **Share** button (box with upward arrow) → scroll down and tap **"Add to Home Screen"**.
   * **Android (Chrome)**: Tap the **three-dots menu** → tap **"Install App"** or **"Add to Home screen"**.
5. DocForge will now live as a full-screen app icon on your phone's home screen!

---

## Method 2: Tailscale Mesh VPN (Access Everywhere: 5G/LTE, Office, Traveling)

*Recommended for accessing your personal DocForge from outside your house without opening any ports on your home router.*

[Tailscale](https://tailscale.com) is a 100% free personal WireGuard mesh VPN (up to 100 devices).

### Step 1: Install Tailscale
1. Download and install Tailscale on your Windows PC and your Phone/Tablet.
2. Sign in with the same personal account (Google, Apple, or GitHub).

### Step 2: Access DocForge Anywhere
Your PC will receive a private Tailscale IP (e.g. `100.85.12.34`) and a machine name (e.g. `my-pc`).
* From your phone on 5G mobile data anywhere in the world, simply visit:
  ```
  http://100.85.12.34:8000
  ```
  or:
  ```
  http://my-pc:8000
  ```

### Step 3: Free Automatic HTTPS with Tailscale Serve (Optional)
Tailscale provides free, signed HTTPS domains:
Run this on your PC:
```cmd
tailscale serve --bg 8000
```
This gives you an encrypted HTTPS address like:
```
https://my-pc.tailnet-name.ts.net
```
With HTTPS, camera capture and service worker PWA features work with full browser security privileges.

---

## Method 3: Cloudflare Tunnel (Free Custom Domain with SSL)

If you own a personal domain (e.g. `yourname.com`) and want an always-accessible web address like `https://docforge.yourname.com` without port forwarding or exposing your home IP:

1. Install Cloudflare Tunnel (`cloudflared`):
   ```cmd
   winget install Cloudflare.cloudflared
   ```
2. Authenticate:
   ```cmd
   cloudflared tunnel login
   ```
3. Create your tunnel:
   ```cmd
   cloudflared tunnel create docforge
   ```
4. Route your domain:
   ```cmd
   cloudflared tunnel route dns docforge docforge.yourname.com
   ```
5. Run the tunnel:
   ```cmd
   cloudflared tunnel run --url http://localhost:8000 docforge
   ```
Cloudflare handles SSL termination, DDoS protection, and routes traffic straight to your local DocForge server.

---

## Method 4: Docker / Always-On Home Server / VPS

If you have a Linux home server (Raspberry Pi, Mini-PC, Unraid, TrueNAS) or a cloud VPS:

1. Clone or copy the DocForge repository to the server.
2. Start the container with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Check status:
   ```bash
   docker compose ps
   docker compose logs -f
   ```
4. Data is persistently stored in the `docforge_data` volume mounted at `/app/storage`.

---

## Security & Maintenance Checklist

### 1. Master Password
The initial master password is set to:
```
DocForgeMaster2026!
```
To change it:
* Go to the DocForge web UI → Settings / Security.
* Or delete `storage/credentials.json` and restart DocForge to trigger the first-time setup prompt.

### 2. Backups
All user state, generated files, and credentials live in:
```
C:\Users\yogit\.gemini\antigravity\scratch\docforge\storage
```
Backing up this single folder preserves all your documents and settings.

### 3. Updating / Rebuilding
Whenever you pull new code:
1. Rebuild frontend: `cd frontend && npm run build`
2. Restart backend: `scripts\stop_docforge.bat` followed by `scripts\run_production.bat` (or `start_silent.vbs`).
