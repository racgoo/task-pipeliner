# AWS S3 Upload Example

Workflows that load AWS credentials and S3 bucket from an `env` file (via `cat` + KV capture), prompt for a local file and S3 object key, and upload to S3. Two variants:

- **CLI** – uses only `aws s3 cp`; requires [AWS CLI](https://aws.amazon.com/cli/) installed.
- **Script** – uses a Node.js helper (`upload-s3.js`) with AWS SDK; requires Node.js and `npm install` in this directory.

> **Note:** This example has not been verified; it may need changes for the current AWS CLI or SDK version/spec. See [AWS docs](https://docs.aws.amazon.com/).

## Requirements

- **AWS credentials** – IAM user with `s3:PutObject` on the target bucket. Stored in `env`.
- **S3 bucket** – Create a bucket in the AWS Console (S3 → Create bucket).
- **CLI variant:** **AWS CLI** – [Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and ensure `aws --version` works.
- **Script variant:** **Node.js 18+** and run `npm install` once in this directory (installs `@aws-sdk/client-s3`).

## Setup: env file

Credentials and bucket are read from an `env` file in this directory. The workflow runs `cat env` and uses KV capture to get `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `S3_BUCKET`.

```bash
cd examples/aws/s3
cp env.example env
# Edit env and set your values:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=ap-northeast-2
# S3_BUCKET=your-bucket-name
```

## Project Structure

```
aws/s3/
├── README.md              # This file
├── env.example           # Template; copy to env and set AWS credentials + S3_BUCKET
├── env                   # Your secrets (create from env.example; do not commit)
├── sample.txt             # Sample file you can upload for testing
├── workflow-cli.yaml      # CLI variant: aws s3 cp only
├── workflow-script.yaml   # Script variant: Node.js upload-s3.js (AWS SDK)
├── upload-s3.js           # Used only by workflow-script.yaml
└── package.json           # Used only by workflow-script.yaml (npm install)
```

## Two ways to run

### 1. CLI (AWS CLI required)

Uses only `aws s3 cp`. No Node dependencies if AWS CLI is installed.

```bash
cd examples/aws/s3
# Ensure env exists with AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
task-pipeliner run workflow-cli.yaml
```

Flow: `cat env` → capture credentials and bucket → prompt for file path and S3 key → `aws s3 cp "{{upload_file}}" "s3://{{S3_BUCKET}}/{{s3_key}}"`.

### 2. Script (Node.js + AWS SDK)

Uses `upload-s3.js` to upload via the AWS SDK. Run `npm install` once in this directory.

```bash
cd examples/aws/s3
npm install
# Ensure env exists
task-pipeliner run workflow-script.yaml
```

Flow: `cat env` → capture credentials and bucket → prompt for file path and S3 key → `node upload-s3.js "{{upload_file}}" "{{s3_key}}"`.

## From project root

```bash
cd examples/aws/s3
cp env.example env
# edit env with your AWS credentials and S3_BUCKET

# CLI variant (requires AWS CLI)
task-pipeliner run workflow-cli.yaml

# Script variant (requires Node.js; run once: npm install)
task-pipeliner run workflow-script.yaml
```

Both workflows use `baseDir: ./`, so run them from `examples/aws/s3` so that `cat env`, `aws`, and `node upload-s3.js` resolve correctly.

## Sample file

`sample.txt` is included so you can try an upload without creating a file. When prompted for "Local file to upload", you can press Enter to use the default `sample.txt`.
