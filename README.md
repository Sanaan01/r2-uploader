# R2 Uploader Frontend

A secure, macOS-styled image uploader for Cloudflare R2.

## Features

- 🎨 Beautiful macOS-style UI with dark mode
- 📸 Drag & drop image upload
- 🏷️ Category tagging (Library, Turkey, Qatar, People, Favorites)
- 📱 Mobile responsive (full-screen on mobile)
- 🔒 Secure uploads via Worker API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
# Worker API URL (your deployed worker)
VITE_UPLOAD_API_URL=https://upload-api.sanaan.dev

# Upload API Key (matches worker secret)
VITE_UPLOAD_API_KEY=your-secret-key
```

### 3. Run Locally

```bash
npm run dev
```

Open http://localhost:5173

### 4. Build for Production

```bash
npm run build
```

## Deployment (Cloudflare Pages)

1. **Connect to GitHub**
   - Cloudflare Dashboard → Pages → Create application
   - Connect this repository

2. **Build Settings**
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output: `dist`

3. **Environment Variables**
   - Add `VITE_UPLOAD_API_URL` and `VITE_UPLOAD_API_KEY` in Pages settings

4. **Deploy**
   - Auto-deploys on every push to `main`

## API Backend

This frontend requires the [r2-uploader-worker](https://github.com/Sanaan01/r2-uploader-worker) to be deployed.

## License

MIT
