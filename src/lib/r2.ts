import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.warn(
    "R2 env vars missing (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME). File upload will fail."
  );
}

const endpoint = accountId
  ? `https://${accountId}.r2.cloudflarestorage.com`
  : undefined;

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
});

export const R2_BUCKET = bucketName ?? "";

export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey && bucketName);
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json",
];

export interface UploadValidation {
  ok: boolean;
  error?: string;
}

export function validateFile(file: File): UploadValidation {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "File size must be under 10MB" };
  }
  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("text/")) {
    return {
      ok: false,
      error: `Allowed types: images, PDF, text/JSON. Got: ${file.type}`,
    };
  }
  return { ok: true };
}

export function validateImageFile(file: File): UploadValidation {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "File size must be under 10MB" };
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: `Allowed image types: JPEG, PNG, GIF, WebP. Got: ${file.type}`,
    };
  }
  return { ok: true };
}

export function getR2Key(userId: string, filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  return `uploads/${userId}/${timestamp}-${sanitized}`;
}

export function getR2KeyForImage(
  prefix: "profile" | "group" | "page",
  identifier: string,
  filename: string
): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  return `${prefix}/${identifier}/${timestamp}-${sanitized}`;
}

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";

export function getPublicUrlForKey(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return `/api/files/${key}`;
}

export async function getObjectFromR2(
  key: string
): Promise<{ body: Buffer; contentType?: string }> {
  const result = await r2Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
  const stream = result.Body;
  if (!stream) {
    throw new Error("NoSuchKey");
  }
  const bytes = await stream.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: result.ContentType ?? undefined,
  };
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}
