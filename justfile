inject:
    just build
    pnpm pack --out task-pipeliner.tgz
    npm i -g task-pipeliner.tgz
    just clean-package

install:
    pnpm install
    cd ./docs && pnpm install
    cd ./generator && pnpm install

test:
    pnpm run test

build:
    just install
    just test
    just lint
    just build-rs
    just build-ts
    just update-license
    just clean-up

build-all:
    just build
    just build-docs 
    just build-generator

update-version version:
    pnpm exec node scripts/update-version.js {{version}}

bump-version:
    pnpm exec node scripts/bump-version.js

build-rs:
    pnpm exec napi build dist --cargo-cwd rust --release
    
build-ts:
    pnpm exec tsc

build-docs:
    cd ./docs && rm -rf build && pnpm run build

build-generator:
    cd ./generator && rm -rf dist && pnpm run build

deploy-docs:
    just build-docs
    aws s3 sync ./docs/build s3://task-pipeliner-docs --region ap-northeast-2 --delete
    @echo "Docs deployed to S3: task-pipeliner-docs"

deploy-generator:
    just build-generator
    aws s3 sync ./generator/dist s3://task-pipeliner-generator --region ap-northeast-2 --delete
    @echo "Docs deployed to S3: task-pipeliner-docs"

deploy:
    just deploy-docs
    just deploy-generator

publish:
    pnpm publish

clean-up:
    rm -f ./task-pipeliner*.node ./index.d.ts

clean-package:
    rm -f ./task-pipeliner.tgz

start-docs:
    cd ./docs && pnpm run build && pnpm run write-translations && pnpm run serve

start-generator:
    cd ./generator && pnpm run build && pnpm run dev

lint-ts:
    pnpm exec tsc --noEmit
    pnpm exec eslint .  --fix

lint-rs:
    cd rust && cargo clippy --workspace --all-targets --all-features -- -D warnings

lint:
    just lint-ts
    just lint-rs

update-license:
    npx license-checker --json --onlyDirectDependencies --excludePrivatePackages | jq -r 'to_entries | .[] | "\(.key): \(.value.licenses // .value.license // "Unknown")"' | sort > OPEN_SOURCE_LICENSE
    echo "License information saved to OPEN_SOURCE_LICENSE"