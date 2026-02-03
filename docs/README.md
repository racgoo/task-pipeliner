# task-pipeliner 문서

이 디렉토리는 [Docusaurus](https://docusaurus.io/)를 사용하여 생성된 문서 사이트입니다.

## 개발 서버 실행

```bash
cd docs
pnpm install
pnpm start
```

또는 프로젝트 루트에서:

```bash
pnpm docs:dev
```

## 빌드

```bash
cd docs
pnpm build
```

또는 프로젝트 루트에서:

```bash
pnpm docs:build
```

## 문서 구조

- `docs/intro.md` - 소개
- `docs/getting-started.md` - 시작하기
- `docs/dsl-reference/` - DSL 참조 문서
  - `workflow-structure.md` - 워크플로우 구조
  - `step-types.md` - 단계 타입
  - `conditions.md` - 조건
  - `variables.md` - 변수
  - `complete-example.md` - 완전한 예제
- `docs/examples.md` - 예제

## 배포

GitHub Pages에 배포하려면:

```bash
cd docs
pnpm deploy
```

또는 프로젝트 루트에서:

```bash
pnpm docs:build
cd docs
pnpm deploy
```
