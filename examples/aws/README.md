# AWS Examples

Examples that integrate task-pipeliner with AWS services. Each subdirectory is a separate example.

> **Note:** These examples have not been verified against the latest AWS CLI or SDK versions. You may need to adjust workflows and scripts depending on AWS API/spec changes (credentials, regions, S3/EC2 behavior). Refer to the [AWS documentation](https://docs.aws.amazon.com/) for current behavior.

**Note:** These examples depend on AWS CLI, SDK, and service behavior. They may require updates when AWS changes versions or specs. They have not been verified to work in all environments; use them as a reference and adjust as needed.

## Services

- **[s3](s3/)** – Upload files to S3 (CLI or Node.js script). Load credentials from `env`, prompt for file and key, then upload.
- **[ec2](ec2/)** – Deploy to EC2 via SSH. Load host, user, and key path from `env`, prompt for the command to run on the server (e.g. `git pull && pm2 restart all`), then run it over SSH.

More AWS service examples may be added here (e.g. Lambda, SQS, etc.).
