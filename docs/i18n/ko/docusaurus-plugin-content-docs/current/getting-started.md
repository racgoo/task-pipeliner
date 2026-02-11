# 시작하기

이 가이드는 task-pipeliner를 처음 사용하는 분들을 위한 단계별 튜토리얼입니다.

## 설치

### Homebrew (macOS/Linux)

macOS와 Linux에서 가장 쉬운 설치 방법은 Homebrew를 사용하는 것입니다:

```bash
# 탭(저장소) 추가
brew tap racgoo/task-pipeliner

# task-pipeliner 설치
brew install task-pipeliner
```

설치 후 다음 명령으로 실행할 수 있습니다:
```bash
task-pipeliner run workflow.yaml
# 또는 짧은 별칭 사용
tp run workflow.yaml
```

설치 확인:
```bash
task-pipeliner --version
# 또는
tp --version
```

**업데이트:**
```bash
# 먼저 Homebrew의 패키지 레지스트리를 업데이트합니다
brew update

# 그 다음 task-pipeliner를 업그레이드합니다
brew upgrade task-pipeliner
```

업그레이드 후 호환 문제(스케줄/데몬 오류 등)가 있으면 `tp clean`으로 `~/.pipeliner` 데이터(스케줄, 데몬 상태, 히스토리)를 초기화하세요. 자세한 내용은 [워크플로우 스케줄링](/docs/schedule#데이터-초기화-tp-clean)을 참조하세요.

### Scoop (Windows)

Windows에서 Scoop을 사용하여 설치:

```bash
# 버킷(저장소) 추가
scoop bucket add task-pipeliner https://github.com/racgoo/scoop-task-pipeliner

# task-pipeliner 설치
scoop install task-pipeliner
```

설치 후 다음 명령으로 실행할 수 있습니다:
```bash
task-pipeliner run workflow.yaml
# 또는 짧은 별칭 사용
tp run workflow.yaml
```

설치 확인:
```bash
task-pipeliner --version
# 또는
tp --version
```

**업데이트:** 버킷을 먼저 갱신한 뒤 앱을 업데이트하세요.
```bash
scoop update
scoop update task-pipeliner
```

업그레이드 후 문제가 있으면 `tp clean`으로 `~/.pipeliner` 데이터를 초기화하세요. 자세한 내용은 [워크플로우 스케줄링](/docs/schedule#데이터-초기화-tp-clean)을 참조하세요.

### 전역 설치 (npm)

npm을 사용하여 전역으로 설치하면 `task-pipeliner` 또는 `tp` 명령을 직접 사용할 수 있습니다:

```bash
npm install -g task-pipeliner
```

또는 `pnpm`을 사용하는 경우:

```bash
pnpm add -g task-pipeliner
```

전역 설치 후 다음 명령으로 실행할 수 있습니다:
```bash
task-pipeliner run workflow.yaml
# 또는 짧은 별칭 사용
tp run workflow.yaml
```

설치 확인:
```bash
task-pipeliner --version
# 또는
tp --version
```

### 프로젝트 설치 (개발 모드)

프로젝트에 devDependency로 설치하면 `npx`로 사용할 수 있습니다:

```bash
npm install -D task-pipeliner
# 또는
pnpm add -D task-pipeliner
```

프로젝트 설치 후 다음 명령으로 실행할 수 있습니다:
```bash
npx task-pipeliner run workflow.yaml
# 또는 짧은 별칭 사용
npx tp run workflow.yaml
```

## 첫 번째 워크플로우

프로젝트 루트에 `workflow.yaml` 또는 `workflow.json` 파일을 생성하세요:

**YAML 형식 (`workflow.yaml`):**

```yaml
name: My First Workflow

steps:
  - run: 'echo "Hello, World!"'
  
  - choose:
      message: "무엇을 하시겠습니까?"
      options:
        - id: build
          label: "프로젝트 빌드"
        - id: test
          label: "테스트 실행"
      as: action
  
  - when:
      var:
        action: build
    run: 'npm run build'
  
  - when:
      var:
        action: test
    run: 'npm test'
```

**JSON 형식 (`workflow.json`):**

```json
{
  "name": "My First Workflow",
  "steps": [
    {
      "run": "echo \"Hello, World!\""
    },
    {
      "choose": {
        "message": "무엇을 하시겠습니까?",
        "options": [
          {
            "id": "build",
            "label": "프로젝트 빌드"
          },
          {
            "id": "test",
            "label": "테스트 실행"
          }
        ],
        "as": "action"
      }
    },
    {
      "when": {
        "var": {
          "action": "build"
        }
      },
      "run": "npm run build"
    },
    {
      "when": {
        "var": {
          "action": "test"
        }
      },
      "run": "npm test"
    }
  ]
}
```

실행:

```bash
task-pipeliner run workflow.yaml
# 또는
task-pipeliner run workflow.json
# 또는 짧은 별칭 사용
tp run workflow.yaml
tp run workflow.json

# 사일런트 모드로 실행 (모든 콘솔 출력 억제)
tp run workflow.yaml --silent
# 또는 짧은 형식 사용
tp run workflow.yaml -s
```

**`tp setup`으로 프로젝트 셋업 (신규 프로젝트 권장):**

프로젝트 루트에서 **`tp setup`**을 실행하면 권장 디렉터리 구조와 예시 파일을 한 번에 만듭니다.

- **디렉터리:** `tp/`, `tp/workflows/`, `tp/schedules/`
- **예시 워크플로우 2개** (`tp/workflows/`, echo 기반): choose·when 예시, profiles·choose·prompt·when 예시
- **예시 스케줄 파일 2개** (`tp/schedules/`): 단일 스케줄 예시, 프로필(Dev/Prod) 사용 예시

이미 있는 파일은 덮어쓰지 않습니다. `tp setup` 후 `tp run`으로 `tp/workflows/`에서 선택하고, `tp schedule add`(경로 없이)로 `tp/schedules/`에서 선택할 수 있습니다.

```bash
# 프로젝트 루트에서
tp setup
tp run              # tp/workflows/에서 선택
tp schedule add     # tp/schedules/에서 선택
```

**`tp` 디렉토리 사용하기 (권장 구조):**

권장 레이아웃은 `tp` 아래에 두 개의 하위 디렉터리를 두는 방식입니다.

- **`tp/workflows/`** – 워크플로우 파일(`.yaml`, `.yml`, `.json`)을 여기에 둡니다. **`tp run`**을 파일 없이 실행하면 task-pipeliner가 가장 가까운 `tp` 디렉터리를 찾고 **`tp/workflows/`**에서 실행할 워크플로우를 선택할 수 있게 합니다.
- **`tp/schedules/`** – 스케줄 파일을 여기에 둡니다. **`tp schedule add`**를 파일 경로 없이 실행하면 가장 가까운 **`tp/schedules/`**에서 스케줄 파일을 선택할 수 있습니다.

```bash
# 방법 1: tp setup 사용 (tp/workflows, tp/schedules + 예시 생성)
tp setup

# 방법 2: 수동으로 구조 만들기
mkdir -p tp/workflows tp/schedules
mv workflow.yaml tp/workflows/

# 파일 없이 실행 – tp/workflows에서 대화형 선택
tp run
```

파일 없이 `tp run`을 실행하면:
1. 가장 가까운 `tp` 디렉터리를 찾습니다 (현재 또는 상위).
2. **`tp/workflows/`** 안의 모든 워크플로우 파일을 나열합니다.
3. 타이핑으로 필터, 화살표(↑↓)로 이동, Enter로 선택·실행하는 대화형 메뉴를 띄웁니다.

메뉴에는 파일 이름과 워크플로우의 `name`(YAML/JSON)이 함께 표시되어 구분하기 쉽습니다.

**사일런트 모드:**
`--silent` (또는 `-s`) 플래그는 워크플로우 실행 중 모든 콘솔 출력을 억제합니다. 종료 코드만 필요한 CI/CD 파이프라인이나 상세한 출력이 필요 없는 자동화 스크립트에 유용합니다.

## 워크플로우 구조 이해하기

### 기본 구조

모든 워크플로우 파일은 다음 구조를 가집니다:

```yaml
name: Workflow Name                    # 선택사항: 워크플로우 표시 이름
baseDir: ./                            # 선택사항: 명령 실행 기본 디렉토리

steps:                                 # 필수: 실행할 단계 배열
  - run: 'echo "Step 1"'
  - run: 'echo "Step 2"'
```

### 단계 (Steps)

각 단계는 다음 중 하나일 수 있습니다:

- **`run`**: 셸 명령 실행
- **`choose`**: 사용자에게 선택 메뉴 표시
- **`prompt`**: 사용자에게 텍스트 입력 요청
- **`parallel`**: 여러 단계를 병렬로 실행
- **`fail`**: 워크플로우를 의도적으로 실패시킴

### 조건 (Conditions)

`when` 절을 사용하여 단계 실행 조건을 지정할 수 있습니다:

```yaml
- when:
    file: ./dist
  run: 'echo "Build exists"'
```

## 실전 예제

### 예제 1: 조건부 설치

```yaml
name: Conditional Install

steps:
  - when:
      not:
        file: ./node_modules
    run: 'npm install'
```

이 워크플로우는 `node_modules` 디렉토리가 없을 때만 `npm install`을 실행합니다.

### 예제 2: 사용자 입력 받기

```yaml
name: User Input Example

steps:
  - prompt:
      message: "버전 번호를 입력하세요:"
      as: version
      default: "1.0.0"
  
  - run: 'echo "Building version {{version}}"'
```

사용자가 입력한 버전 번호를 변수로 저장하고, 명령에서 사용합니다.

### 예제 3: 병렬 실행

```yaml
name: Parallel Execution

steps:
  - parallel:
      - run: 'npm run test:unit'
      - run: 'npm run test:integration'
      - run: 'npm run lint'
```

여러 테스트를 동시에 실행하여 시간을 절약합니다.

## 추가 명령어

### 리소스 열기

브라우저에서 시각적 생성기나 문서를 빠르게 열 수 있습니다:

```bash
tp open generator  # 시각적 워크플로우 생성기 열기
tp open docs       # 문서 사이트 열기
```

### 데이터 초기화

업그레이드 후 호환 문제(스케줄/데몬 오류 등)가 있으면 모든 로컬 데이터를 초기화할 수 있습니다:

```bash
tp clean
```

이 명령어는:
- 삭제 전 확인 메시지를 표시합니다
- 스케줄러 데몬이 실행 중이면 먼저 종료합니다
- `~/.pipeliner`의 모든 데이터를 삭제합니다 (스케줄, 데몬 상태, 워크플로우 히스토리)

**언제 사용하나요:** 버전 업그레이드 후 호환 문제가 있으면 `tp clean`으로 로컬 데이터를 초기화하고 다시 시작하세요.

## 다음 단계

- **[CLI 명령어 참조](/docs/cli-reference)** - 모든 CLI 명령어에 대한 완전한 참조
- **[워크플로우 구조](/docs/dsl-reference/workflow-structure)** - 워크플로우 파일의 구조 이해하기
- **[단계 타입](/docs/dsl-reference/step-types)** - 사용 가능한 모든 단계 타입
- **[조건](/docs/dsl-reference/conditions)** - 조건부 실행 방법
- **[변수](/docs/dsl-reference/variables)** - 변수 사용법
- **[실행 히스토리](/docs/history)** - 과거 실행 내역 관리하기
- **[예제](/docs/examples)** - 더 많은 예제 보기
