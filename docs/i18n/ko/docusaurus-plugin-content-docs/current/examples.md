# 예제

task-pipeliner 사용 예제를 확인하세요.

## 프로젝트 예제

완전한 프로젝트 예제는 `examples/` 디렉토리를 확인하세요:

### tp setup 및 tp 디렉터리 구조 {#tp-setup}

- **`tp setup`** – 프로젝트 루트에서 실행하면 `tp/`, `tp/workflows/`, `tp/schedules/`와 예시 워크플로우 2개(choose, when, profiles, prompt), 예시 스케줄 파일 2개(프로필 사용 포함)가 생성됩니다. 모든 단계는 `echo`로 되어 있어 안전하게 실행한 뒤 실제 명령으로 바꿀 수 있습니다. [시작하기](/docs/getting-started#project-setup-with-tp-setup-recommended-for-new-projects), [CLI 참조](/docs/cli-reference#tp-setup)를 참조하세요.
- **`tp-setup-example/`** – `tp setup`이 생성하는 구조와 파일 내용을 그대로 담은 예제. 참고용으로 보거나 복사할 수 있습니다.
- **`tp-directory-example/`** – 권장 레이아웃 사용: 워크플로우는 **`tp/workflows/`**, 스케줄 파일은 **`tp/schedules/`**. `tp run`(파일 없이)으로 `tp/workflows/`에서 선택하고, `tp schedule add`(경로 없이)로 `tp/schedules/`에서 선택할 수 있습니다.

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
- **`shell-example.yaml`** - Shell 설정 (전역·단계별; bash, zsh, sh). [Shell 설정](/docs/dsl-reference/shell) 참조.
- **`shell-windows-example.yaml`** - Windows 셸 예제 (cmd, PowerShell, pwsh, Git Bash, WSL).
- **`timeout-retry-example.yaml`** - 타임아웃 및 재시도 기능
- **`pm2-like-example.yaml`** - 무한 재시도를 사용한 PM2 같은 프로세스 관리자로 서비스 유지
- **`capture-example.yaml`** - 표준 출력 캡처 예제 (전략별 추출, 이후 스텝에서 변수 사용)
- **`env-example.yaml`** - .env 스타일 내용을 변수로 불러오기 (echo로 바로 실행 가능; 실제 파일 사용 선택). 캡처한 값을 이후 스텝에서 `{{변수}}`로 사용. 저장소 루트에서: `task-pipeliner run examples/yaml-examples/env-example.yaml`
- **`var-injection-example.yaml`** - CLI 변수 주입 (`-v` / `--var`). 프로필과 같은 키를 주입하면 주입값이 우선함을 보여줌 (예: `tp run ... --profile Test` 후 `tp run ... --profile Test -v mode=staging -v label=from-cli`).

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
- **`capture-example.json`** - 표준 출력 캡처 예제 (YAML 버전과 동일)
- **`env-example.json`** - .env 스타일 내용을 변수로 불러오기 (바로 실행 가능; env-example.yaml과 동일)
- **`var-injection-example.json`** - CLI 변수 주입 (`-v`/`--var`); 같은 키면 주입값이 프로필을 덮어씀.
- **`shell-example.json`** - Shell 설정 (shell-example.yaml과 동일).
- **`shell-windows-example.json`** - Windows 셸 예제 (shell-windows-example.yaml과 동일).

**참고:** YAML과 JSON 형식 모두 완전히 지원됩니다. 선호하는 형식을 선택하세요 - 가독성을 위해 YAML, 프로그래밍 방식 생성을 위해 JSON.

## 스케줄 예제

스케줄 파일 예제는 `examples/schedule-examples/`에서 확인하세요. `tp schedule add <파일>`로 등록하거나, **`tp schedule add`**를 경로 없이 실행해 가장 가까운 **`tp/schedules/`** 디렉터리에서 파일을 선택할 수 있습니다(예: `tp setup` 후).

- **`daily-build.yaml`** - YAML 스케줄 파일 (여러 스케줄, silent, profile, baseDir)
- **`daily-build.json`** - JSON 스케줄 파일 (동일 내용)
- **`README.md`** - 스케줄 파일 형식 및 cron 표현식 참조

**스케줄 UI:** **add**, **toggle**, **remove** 후에는 해당 스케줄이 **`tp schedule list`와 같은 카드 형식**으로 표시됩니다(크론, 언제 실행되는지 설명, 다음 실행, 활성 여부). **toggle** 후에는 **ENABLED** 또는 **DISABLED**가 강조(굵게·색상)됩니다. 자세한 내용은 [워크플로우 스케줄링](/docs/schedule#통일된-스케줄-ui-list-add-toggle-remove)을 참조하세요.

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

실행: `tp schedule add schedules.yaml` (또는 `tp schedule add`로 `tp/schedules/`에서 선택).

`tp schedule list`, `tp schedule status`(한 번만 보려면 `tp schedule status -n`)로 통일된 카드 레이아웃의 스케줄을 볼 수 있습니다. 업그레이드 후 호환 문제가 있으면 `tp clean`으로 `~/.pipeliner` 데이터를 초기화하세요. 자세한 내용은 **[워크플로우 스케줄링](/docs/schedule)** 문서와 [데이터 초기화 (`tp clean`)](/docs/schedule#데이터-초기화-tp-clean)를 참조하세요.

## 빠른 예제

### 기본 워크플로우

```yaml
name: Basic Workflow

steps:
  - run: 'echo "Hello, World!"'
```

### 조건부 실행

```yaml
name: Conditional Execution

steps:
  - when:
      file: ./package.json
    run: 'npm install'
  
  - when:
      not:
        file: ./dist
    run: 'npm run build'
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
    run: 'echo "프로덕션 배포 중"'
```

### 변수 사용

```yaml
name: Variable Usage

steps:
  - prompt:
      message: "버전 번호를 입력하세요:"
      as: version
      default: "1.0.0"
  
  - run: 'echo "Building version {{version}}"'
  
  - run: 'npm version {{version}}'
```

### 병렬 실행

```yaml
name: Parallel Execution

steps:
  - parallel:
      - run: 'npm run test:unit'
      - run: 'npm run test:integration'
      - run: 'npm run lint'
```

## 다음 단계

- **[시작하기](/docs/getting-started)** - 설치부터 첫 워크플로우까지
- **[DSL 참조](/docs/dsl-reference/workflow-structure)** - 완전한 문법 가이드
- **[워크플로우 스케줄링](/docs/schedule)** - cron으로 워크플로우 예약
