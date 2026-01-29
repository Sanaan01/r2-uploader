# r2-uploader

Simple Cloudflare R2 uploader service that supports direct uploads via the server and presigned URLs for client-side uploads.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Fill in the environment variables.

## Development

```bash
npm run dev
```

## API

### `GET /health`

Returns `{ ok: true }`.

### `POST /upload`

Uploads a file directly via the server (multipart form-data).

- Form field: `file`
- Optional field: `folder`

Response:

```json
{
  "key": "uploads/2024-10-01T12-00-00-000Z-photo.png",
  "publicUrl": "https://your-public-domain/uploads/2024-10-01T12-00-00-000Z-photo.png"
}
```

### `POST /presign`

Returns a presigned URL for client-side uploads.

Request body:

```json
{
  "filename": "photo.png",
  "contentType": "image/png",
  "folder": "gallery"
}
```

Response:

```json
{
  "key": "uploads/gallery/2024-10-01T12-00-00-000Z-photo.png",
  "url": "https://...",
  "publicUrl": "https://your-public-domain/uploads/gallery/2024-10-01T12-00-00-000Z-photo.png",
  "expiresIn": 900
}
```

You can `PUT` the file to the presigned `url` with the provided `contentType`, then use `publicUrl` in your gallery data.
