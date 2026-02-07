# task-pipeliner

> 조건 기반 실행과 아름다운 CLI 출력을 제공하는 강력한 워크플로우 오케스트레이션 도구

**버전:** 0.3.6

![fox2](https://github.com/user-attachments/assets/fdf8d786-6a91-4d2d-9dc1-72be6f3ccd98)

[![npm version](https://img.shields.io/npm/v/task-pipeliner)](https://www.npmjs.com/package/task-pipeliner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**task-pipeliner**는 간단한 YAML 또는 JSON 파일로 복잡한 워크플로우를 정의, 조율, 실행할 수 있는 현대적인 워크플로우 오케스트레이션 도구입니다. 조건부 실행, 병렬 작업, 대화형 프롬프트, 그리고 아름다운 터미널 출력을 제공하여 빌드 스크립트, 배포 워크플로우, CI/CD 파이프라인에 완벽합니다. *아직 베타 버전이라 인터페이스가 조금씩 수정될 수 있습니다.*

**README-Language-Map** [KR [한국어 버전]](https://github.com/racgoo/task-pipeliner/blob/main/README.ko.md) / [EN [English Version]](https://github.com/racgoo/task-pipeliner)

> **📖 자세한 내용은 [공식 문서](https://task-pipeliner.racgoo.com/)를 참조하세요!**  
> 이 README는 빠른 시작과 기본 사용법을 제공합니다. DSL 문법, 고급 기능, 예제 등 자세한 내용은 문서 사이트에서 확인할 수 있습니다.

## 리소스

### 문서 및 도구

- **[📖 공식 문서](https://task-pipeliner.racgoo.com/)** - **완전한 DSL 참조, 가이드, 예제 및 모든 기능 설명** ⭐
- 🎨 **[워크플로우 생성기](https://task-pipeliner-generator.racgoo.com/)** - 브라우저에서 시각적으로 워크플로우 생성

### 저장소 및 패키지 관리자

- 💻 **[GitHub](https://github.com/racgoo/task-pipeliner)** - 소스 코드 및 이슈 추적
- 📦 **[npm](https://www.npmjs.com/package/task-pipeliner)** - npm 레지스트리 패키지
- 🍺 **[Homebrew](https://github.com/racgoo/homebrew-task-pipeliner)** - macOS/Linux용 Homebrew 탭
- 🪟 **[Scoop](https://github.com/racgoo/scoop-task-pipeliner)** - Windows용 Scoop 버킷

## ✨ 주요 기능

> 💡 **각 기능에 대한 자세한 설명과 예제는 [DSL 참조 문서](https://task-pipeliner.racgoo.com/docs/dsl-reference/workflow-structure)를 확인하세요.**

-  **조건 기반 실행** - 파일 존재 여부, 사용자 선택, 환경 변수 등을 기반으로 단계 실행

- **병렬 실행** - 여러 작업을 동시에 병렬로 실행

- **대화형 프롬프트** - 실행 중 사용자에게 입력과 선택을 요청

- **YAML & JSON 지원** - 선언적인 파이프라이닝을 YAML & JSON 형식으로 제공

- **변수 치환** - 워크플로우 전반에서 `{{variables}}` 사용

- **프로필** - 미리 정의한 변수로 비대화형 실행 (`tp run --profile <name>`); 프로필에 설정된 변수에 대해서는 choose/prompt 단계 생략

- **실행 히스토리** - 상세한 단계별 기록으로 과거 워크플로우 실행 추적 및 검토

- **워크플로우 스케줄링** - cron 표현식을 사용하여 지정된 시간에 워크플로우 자동 실행

### CLI 명령어

> 💡 **CLI 명령어에 대한 자세한 설명은 [CLI 참조 문서](https://task-pipeliner.racgoo.com/docs/cli-reference)를 확인하세요.**

**프로젝트 셋업 (신규 프로젝트 권장):**
```bash
tp setup   # tp/, tp/workflows, tp/schedules 생성 및 예시 워크플로우 2개·예시 스케줄 2개 추가 (echo 기반; choose, when, profiles, prompt 포함)
```
프로젝트 루트에서 실행. `tp/workflows/`, `tp/schedules/`를 만들고, choose·when·profiles·prompt를 쓴 예시 워크플로우와 cron·프로필을 쓴 예시 스케줄을 넣습니다. 이미 있는 파일은 덮어쓰지 않습니다.

**워크플로우 실행:**
```bash
tp run workflow.yaml        # 워크플로우 실행
tp run                      # 가장 가까운 tp/workflows 디렉토리에서 워크플로우 선택하여 실행
tp run workflow.yaml --profile Test   # 프로필로 실행 (프로필에 설정된 변수는 choose/prompt 생략)
tp run workflow.yaml -p Test         # 프로필 짧은 형식
tp run workflow.yaml --silent  # 사일런트 모드로 실행 (모든 콘솔 출력 억제)
tp run workflow.yaml -s     # 사일런트 모드 짧은 형식
```

**리소스 열기:**
```bash
tp open generator  # 시각적 생성기 열기
tp open docs       # 문서 열기
```

**히스토리 관리:**
```bash
tp history         # 워크플로우 실행 히스토리 보기
tp history show    # 특정 히스토리 선택하여 보기
tp history remove   # 특정 히스토리 삭제
tp history remove-all # 모든 히스토리 삭제
```

**워크플로우 스케줄링:**
```bash
tp schedule        # 모든 스케줄 보기 (tp schedule list와 동일)
tp schedule list   # 스케줄 목록 및 데몬 상태 (각 스케줄을 카드로 표시: cron, 언제 실행되는지 설명, 다음 실행 시각 등)
tp schedule add schedules.yaml  # 스케줄 파일에서 추가; 파일 경로 생략 시 가장 가까운 tp/schedules에서 선택
tp schedule add    # 가장 가까운 tp/schedules 디렉토리에서 스케줄 파일 선택
tp schedule remove # 스케줄 삭제; 삭제 후 삭제된 스케줄을 list와 동일한 카드 형식으로 표시
tp schedule remove-all # 모든 스케줄 삭제
tp schedule toggle # 스케줄 활성화/비활성화; 토글 후 ENABLED/DISABLED를 굵게·색상으로 강조하고 스케줄 카드 표시
tp schedule start  # 포그라운드 모드로 스케줄러 시작
tp schedule start -d  # 백그라운드 데몬 모드로 스케줄러 시작
tp schedule stop   # 스케줄러 데몬 종료
tp schedule status # 데몬·스케줄 상태 확인 (실시간 모드; Ctrl+C는 화면만 종료, 데몬은 계속 실행)
```
`tp schedule add`, `toggle`, `remove` 후에는 해당 스케줄이 `tp schedule list`와 같은 카드 레이아웃(크론, 언제 실행되는지 설명, 다음 실행, 활성 여부)으로 표시됩니다. 토글 후에는 ENABLED/DISABLED가 강조되어 새 상태를 한눈에 알 수 있습니다.

**스케줄 상태 (실시간 뷰)** — `tp schedule status`로 데몬과 모든 스케줄을 스크롤 가능한 실시간 화면으로 확인할 수 있습니다. Cron 시간에는 타임존(UTC 또는 local)이 함께 표시됩니다. 스케줄이 많을 때는 ↑/↓ 또는 PgUp/PgDn으로 스크롤할 수 있습니다.

<p align="center"><img src="https://github.com/user-attachments/assets/348325d3-d184-4c1e-bc78-040da13e7e7d" width="720" alt="tp schedule status 실시간 뷰" /></p>

**데이터 및 업그레이드:**
```bash
tp clean   # ~/.pipeliner 전체 삭제 (스케줄, 데몬 상태, 워크플로우 히스토리)
```
버전 업그레이드 후 호환이 맞지 않을 때(스케줄/데몬 오류 등)는 `tp clean`으로 로컬 데이터를 초기화하면 됩니다. 실행 중인 데몬이 있으면 먼저 종료된 뒤 삭제됩니다.

## 🚀 빠른 시작

### 설치

#### Homebrew (macOS/Linux)

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

업그레이드 후 호환 문제(스케줄/데몬 오류 등)가 있으면 `tp clean`으로 `~/.pipeliner` 데이터(스케줄, 데몬 상태, 히스토리)를 초기화하세요.

#### Scoop (Windows)

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

**업데이트:**
```bash
scoop update task-pipeliner
```

업그레이드 후 문제가 있으면 `tp clean`으로 `~/.pipeliner` 데이터를 초기화하세요.

#### 전역 설치 (npm)

npm을 사용하여 전역으로 설치하면 `task-pipeliner` 또는 `tp` 명령을 직접 사용할 수 있습니다:

```bash
npm install -g task-pipeliner
# 또는
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

#### 프로젝트 설치 (개발 모드)

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

### 기본 사용법

> 💡 **더 많은 예제와 고급 사용법은 [시작하기 가이드](https://task-pipeliner.racgoo.com/docs/getting-started)와 [예제 문서](https://task-pipeliner.racgoo.com/docs/examples)를 참조하세요.**

`workflow.yaml` 또는 `workflow.json` 파일을 생성하세요:

**YAML 형식 (`workflow.yaml`):**

```yaml
name: My Workflow

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
  "name": "My Workflow",
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

**`tp` 디렉토리 사용하기 (권장):**

권장 프로젝트 구조는 `tp` 디렉토리 아래에 두 개의 하위 디렉토리를 두는 방식입니다.

- **`tp/workflows/`** – 워크플로우 파일(YAML 또는 JSON). 파일 없이 `tp run`을 실행하면 task-pipeliner가 가장 가까운 `tp` 디렉토리를 찾고, **`tp/workflows/`** 안에서 실행할 워크플로우를 선택할 수 있게 합니다.
- **`tp/schedules/`** – 스케줄 파일(YAML 또는 JSON). `tp schedule add` 실행 시 파일 경로를 주지 않으면 가장 가까운 **`tp/schedules/`** 안에서 스케줄 파일을 선택할 수 있습니다.

**빠른 셋업:** 프로젝트 루트에서 `tp setup`을 실행하면 `tp/`, `tp/workflows/`, `tp/schedules/`가 생성되고, 예시 워크플로우 2개와 예시 스케줄 파일 2개(echo 기반, choose·when·profiles·prompt 및 스케줄 프로필 사용 예시 포함)가 추가됩니다. 이미 있는 파일은 덮어쓰지 않습니다.

```bash
# 방법 1: tp setup 사용 (tp/workflows, tp/schedules + 예시 생성)
tp setup

# 방법 2: 수동으로 구조 만들기
mkdir -p tp/workflows tp/schedules
mv workflow.yaml tp/workflows/

# 파일 없이 실행 - tp/workflows에서 대화형 선택
tp run
```

파일을 지정하지 않고 `tp run`을 실행하면:
1. 가장 가까운 `tp` 디렉토리를 찾습니다 (현재 디렉토리 또는 상위).
2. **`tp/workflows/`** 안의 모든 워크플로우 파일 (`.yaml`, `.yml`, `.json`)을 나열합니다.
3. 타이핑으로 필터, 화살표(↑↓)로 이동, Enter로 선택·실행하는 대화형 검색 메뉴를 띄웁니다.

메뉴에는 파일 이름과 워크플로우의 `name`(YAML/JSON)이 함께 표시되어 구분하기 쉽습니다.

**사일런트 모드:**
`--silent` (또는 `-s`) 플래그는 워크플로우 실행 중 모든 콘솔 출력을 억제합니다. 다음 경우에 유용합니다:
- 종료 코드만 필요한 CI/CD 파이프라인
- 상세한 출력이 필요 없는 자동화 스크립트
- 로그의 노이즈 감소

참고: 사일런트 모드는 명령 출력, 단계 헤더, 에러 메시지를 포함한 모든 출력을 억제합니다. 워크플로우는 정상적으로 실행되며 적절한 종료 코드를 반환합니다.

## 📚 더 알아보기

이 README는 기본적인 사용법만 다룹니다. 더 자세한 내용은 다음 문서를 참조하세요:

- **[시작하기](https://task-pipeliner.racgoo.com/docs/getting-started)** - 설치부터 첫 워크플로우까지
- **[DSL 참조](https://task-pipeliner.racgoo.com/docs/dsl-reference/workflow-structure)** - 완전한 문법 가이드
  - [워크플로우 구조](https://task-pipeliner.racgoo.com/docs/dsl-reference/workflow-structure)
  - [단계 타입](https://task-pipeliner.racgoo.com/docs/dsl-reference/step-types)
  - [조건](https://task-pipeliner.racgoo.com/docs/dsl-reference/conditions)
  - [변수](https://task-pipeliner.racgoo.com/docs/dsl-reference/variables)
  - [프로필](https://task-pipeliner.racgoo.com/docs/dsl-reference/profiles)
- **[CLI 참조](https://task-pipeliner.racgoo.com/docs/cli-reference)** - 모든 CLI 명령어 상세 설명
- **[예제](https://task-pipeliner.racgoo.com/docs/examples)** - 실제 사용 사례와 예제
- **[실행 히스토리](https://task-pipeliner.racgoo.com/docs/history)** - 과거 실행 기록 관리
- **[워크플로우 스케줄링](https://task-pipeliner.racgoo.com/docs/schedule)** - cron을 사용한 자동 실행

## 기여하기

기여를 환영합니다! ISSUE를 남겨주세요.

## 라이선스

Copyright (c) 2026 racgoo

## 문의 및 연락

문의 사항은 lhsung98@naver.com 으로 메일 보내주세요!
