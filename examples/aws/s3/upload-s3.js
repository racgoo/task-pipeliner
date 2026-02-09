#!/usr/bin/env node
/**
 * Upload a file to AWS S3 using the AWS SDK.
 * Usage: node upload-s3.js <local-file> <s3-key>
 * Requires env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
 * Run `npm install` in this directory first.
 */

const { readFileSync } = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const localFile = process.argv[2];
const s3Key = process.argv[3];

if (!localFile || !s3Key) {
  console.error('Usage: node upload-s3.js <local-file> <s3-key>');
  process.exit(1);
}

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET;

if (!accessKeyId || !secretAccessKey || !region || !bucket) {
  console.error('Error: Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET');
  process.exit(1);
}

(async () => {
  try {
    const body = readFileSync(localFile);
    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: body,
      })
    );
    console.log('Upload successful.');
  } catch (err) {
    console.error('Upload failed:', err.message);
    process.exit(1);
  }
})();
