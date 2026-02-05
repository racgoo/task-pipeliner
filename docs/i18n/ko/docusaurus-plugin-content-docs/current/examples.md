# 예제

task-pipeliner 사용 예제를 확인하세요.

## 프로젝트 예제

완전한 프로젝트 예제는 `examples/` 디렉토리를 확인하세요:

### 모노레포 예제 {#monorepo-example}

- **`monorepo-example/`** - 여러 프로젝트가 있는 모노레포 워크플로우

### 간단한 프로젝트 예제 {#simple-project}

- **`simple-project/`** - 간단한 단일 프로젝트 워크플로우

### React 앱 예제

- **`react-app/`** - React 애플리케이션 빌드 및 배포

## YAML 예제

`examples/yaml-examples/`에서 YAML 워크플로우 예제를 확인하세요:

- **`basic.yaml`** - 선택과 조건이 있는 기본 워크플로우
- **`simple.yaml`** - 최소한의 워크플로우 예제
- **`parallel.yaml`** - 병렬 실행 예제
- **`conditions.yaml`** - 다양한 조건 타입
- **`file-checks.yaml`** - 파일 존재 확인
- **`prompt.yaml`** - 사용자 입력 프롬프트
- **`variables.yaml`** - 변수 치환 예제
- **`var-value-example.yaml`** - 변수 값 비교 예제
- **`choice-as-example.yaml`** - 선택에서 `as` 키워드 사용
- **`base-dir-example.yaml`** - baseDir 설정 예제
- **`timeout-retry-example.yaml`** - 타임아웃 및 재시도 기능
- **`pm2-like-example.yaml`** - 무한 재시도를 사용한 PM2 같은 프로세스 관리자로 서비스 유지

### CI/CD 파이프라인 {#cicd-파이프라인}

- **`cicd.yaml`** - CI/CD 파이프라인 예제

- **`advanced.yaml`** - 고급 워크플로우 패턴
- **`multi-choice.yaml`** - 여러 순차적 선택
- **`react.yaml`** - React 전용 워크플로우

## JSON 예제

`examples/json-examples/`에서 JSON 워크플로우 예제를 확인하세요 (YAML 예제와 동일):

- **`basic.json`** - 선택과 조건이 있는 기본 워크플로우
- **`simple.json`** - 최소한의 워크플로우 예제
- **`parallel.json`** - 병렬 실행 예제
- **`conditions.json`** - 조건 평가 예제
- **`prompt.json`** - 사용자 입력 프롬프트
- **`variables.json`** - 변수 치환 예제

**참고:** YAML과 JSON 형식 모두 완전히 지원됩니다. 선호하는 형식을 선택하세요 - 가독성을 위해 YAML, 프로그래밍 방식 생성을 위해 JSON.

## 스케줄 예제

스케줄 파일 예제는 `examples/schedule-examples/`에서 확인하세요. `tp schedule add <파일>`로 등록할 수 있습니다.

- **`daily-build.yaml`** - YAML 스케줄 파일 (여러 스케줄, silent, profile, baseDir)
- **`daily-build.json`** - JSON 스케줄 파일 (동일 내용)
- **`README.md`** - 스케줄 파일 형식 및 cron 표현식 참조

### 스케줄 파일 예시

```yaml
schedules:
  - name: Daily Build
    cron: "0 9 * * *"
    workflow: ./build.yaml

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true

  - name: Production Deploy
    cron: "0 18 * * 5"
    workflow: ./deploy.yaml
    profile: Production
```

실행: `tp schedule add schedules.yaml`

`tp schedule list`, `tp schedule status`(한 번만 보려면 `tp schedule status -n`)로 통일된 카드 레이아웃의 스케줄을 볼 수 있습니다. 업그레이드 후 호환 문제가 있으면 `tp clean`으로 `~/.pipeliner` 데이터를 초기화하세요. 자세한 내용은 **[워크플로우 스케줄링](/docs/schedule)** 문서와 [데이터 초기화 (`tp clean`)](/docs/schedule#데이터-초기화-tp-clean)를 참조하세요.

## 빠른 예제

### 기본 워크플로우

```yaml
name: Basic Workflow

steps:
  - run: echo "Hello, World!"
```

### 조건부 실행

```yaml
name: Conditional Execution

steps:
  - when:
      file: ./package.json
    run: npm install
  
  - when:
      not:
        file: ./dist
    run: npm run build
```

### 사용자 선택

```yaml
name: User Choice

steps:
  - choose:
      message: "환경을 선택하세요:"
      options:
        - id: dev
          label: "개발"
        - id: staging
          label: "스테이징"
        - id: prod
          label: "프로덕션"
      as: env
  
  - when:
      var:
        env: prod
    run: echo "프로덕션 배포 중"
```

### 변수 사용

```yaml
name: Variable Usage

steps:
  - prompt:
      message: "버전 번호를 입력하세요:"
      as: version
      default: "1.0.0"
  
  - run: echo "Building version {{version}}"
  
  - run: npm version {{version}}
```

### 병렬 실행

```yaml
name: Parallel Execution

steps:
  - parallel:
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run lint
```

## 다음 단계

- **[시작하기](/docs/getting-started)** - 설치부터 첫 워크플로우까지
- **[DSL 참조](/docs/dsl-reference/workflow-structure)** - 완전한 문법 가이드
- **[워크플로우 스케줄링](/docs/schedule)** - cron으로 워크플로우 예약
