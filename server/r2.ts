import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || "elizabeth-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

let s3Client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export async function uploadToR2(filePath: string, key: string, contentType: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return `/uploads/${path.basename(filePath)}`;
  }
  const fileBuffer = fs.readFileSync(filePath);
  await client.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: fileBuffer, ContentType: contentType }));
  try { fs.unlinkSync(filePath); } catch {}
  if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${key}`;
  return `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.dev/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  try { await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })); } catch {}
}
