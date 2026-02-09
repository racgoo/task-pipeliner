# EC2 Deploy Example

Workflow that loads EC2 connection details from an `env` file (via `cat` + KV capture), prompts for the deploy command to run on the server, and runs it over SSH.

Use this to deploy or run commands on an existing EC2 instance (e.g. `git pull`, `npm install`, `pm2 restart`).

> **Note:** This example has not been verified; it may need changes for your environment or AWS/SSH behavior. See [AWS docs](https://docs.aws.amazon.com/).

## Requirements

- **EC2 instance** – Running Linux with SSH (port 22) open to your IP. Use the instance public IP or DNS in `env`.
- **SSH key** – The `.pem` key pair you used when launching the instance. Path in `env` as `SSH_KEY_PATH` (relative to this directory or absolute).
- **SSH client** – OpenSSH (`ssh`) on your machine (default on macOS/Linux; on Windows use WSL or [OpenSSH](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse)).

## Setup: env file

Connection details are read from an `env` file in this directory. The workflow runs `cat env` and uses KV capture to get `EC2_HOST`, `SSH_USER`, and `SSH_KEY_PATH`.

```bash
cd examples/aws/ec2
cp env.example env
# Edit env:
# EC2_HOST=your-instance-public-ip-or-dns
# SSH_USER=ubuntu   (or ec2-user for Amazon Linux)
# SSH_KEY_PATH=./my-key.pem
```

- **EC2_HOST** – Public IP (e.g. `3.35.1.2`) or public DNS (e.g. `ec2-3-35-1-2.ap-northeast-2.compute.amazonaws.com`).
- **SSH_USER** – `ubuntu` for Ubuntu AMI, `ec2-user` for Amazon Linux.
- **SSH_KEY_PATH** – Path to your `.pem` file. If you keep the key in this directory, use `./my-key.pem`.

## Project Structure

```
aws/ec2/
├── README.md              # This file
├── env.example           # Template; copy to env and set EC2_HOST, SSH_USER, SSH_KEY_PATH
├── env                   # Your secrets (create from env.example; do not commit)
└── workflow-cli.yaml     # Load env, prompt for deploy command, run via SSH
```

## How to run

```bash
cd examples/aws/ec2
# Ensure env exists with EC2_HOST, SSH_USER, SSH_KEY_PATH
task-pipeliner run workflow-cli.yaml
```

Flow: `cat env` → capture host, user, key path → prompt for "Deploy command to run on server" (default: `cd /var/www/app && git pull && npm install --production && pm2 restart all`) → run `ssh -i key user@host "command"`.

Change the default command in the prompt to match your app path and process manager (e.g. `systemctl restart myapp`, `docker compose up -d --build`).

## From project root

```bash
cd examples/aws/ec2
cp env.example env
# edit env with your EC2_HOST, SSH_USER, SSH_KEY_PATH
task-pipeliner run workflow-cli.yaml
```

The workflow uses `baseDir: ./`, so run it from `examples/aws/ec2` so that `cat env` and `ssh -i "{{SSH_KEY_PATH}}"` resolve correctly (key path is relative to this directory).

## Optional: sync files then deploy

To upload files before running the deploy command, add a step that uses `rsync` or `scp` before the SSH step, or run `rsync`/`scp` inside your deploy command. Example (run from a directory that contains your app):

```yaml
# Example extra step (adjust paths and add to workflow as needed):
- run: 'rsync -avz -e "ssh -i {{SSH_KEY_PATH}} -o StrictHostKeyChecking=accept-new" ./ {{SSH_USER}}@{{EC2_HOST}}:/var/www/app/'
```

Then use the prompt to run something like `pm2 restart all` or `systemctl restart myapp` on the server.
