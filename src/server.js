import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const {
  PORT = 3000,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE_URL,
  R2_PREFIX = "uploads/",
  R2_SIGNED_URL_EXPIRES_SECONDS = "900"
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.warn(
    "Missing required R2 config. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET are set."
  );
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: R2_SECRET_ACCESS_KEY ?? ""
  }
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const buildObjectKey = (filename, folder = "") => {
  const safeFolder = folder ? `${folder.replace(/\/+$/, "")}/` : "";
  const safePrefix = R2_PREFIX ? `${R2_PREFIX.replace(/\/+$/, "")}/` : "";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safePrefix}${safeFolder}${timestamp}-${filename}`;
};

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing file field 'file'." });
    }

    const key = buildObjectKey(req.file.originalname, req.body?.folder);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });

    await s3Client.send(command);

    const publicUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL}/${key}` : null;

    return res.status(201).json({ key, publicUrl });
  } catch (error) {
    console.error("Upload failed", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/presign", async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body ?? {};

    if (!filename || !contentType) {
      return res.status(400).json({
        error: "Missing filename or contentType in request body."
      });
    }

    const key = buildObjectKey(filename, folder);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType
    });

    const expiresIn = Number.parseInt(R2_SIGNED_URL_EXPIRES_SECONDS, 10) || 900;
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    const publicUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL}/${key}` : null;

    return res.json({ key, url, publicUrl, expiresIn });
  } catch (error) {
    console.error("Presign failed", error);
    return res.status(500).json({ error: "Presign failed" });
  }
});

app.listen(PORT, () => {
  console.log(`R2 uploader listening on port ${PORT}`);
});
