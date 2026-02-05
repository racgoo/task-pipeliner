# task-pipeliner

> 조건 기반 실행과 아름다운 CLI 출력을 제공하는 강력한 워크플로우 오케스트레이션 도구

**버전:** 0.3.2

![fox2](https://github.com/user-attachments/assets/fdf8d786-6a91-4d2d-9dc1-72be6f3ccd98)

[![npm version](https://img.shields.io/npm/v/task-pipeliner)](https://www.npmjs.com/package/task-pipeliner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**task-pipeliner**는 간단한 YAML 또는 JSON 파일로 복잡한 워크플로우를 정의, 조율, 실행할 수 있는 현대적인 워크플로우 오케스트레이션 도구입니다. 조건부 실행, 병렬 작업, 대화형 프롬프트, 그리고 아름다운 터미널 출력을 제공하여 빌드 스크립트, 배포 워크플로우, CI/CD 파이프라인에 완벽합니다.

**README-Language-Map** [KR [한국어 버전]](https://github.com/racgoo/task-pipeliner/blob/main/README.ko.md) / [EN [English Version]](https://github.com/racgoo/task-pipeliner)

## ✨ 주요 기능

-  **조건 기반 실행** - 파일 존재 여부, 사용자 선택, 환경 변수 등을 기반으로 단계 실행

- **병렬 실행** - 여러 작업을 동시에 병렬로 실행

- **대화형 프롬프트** - 실행 중 사용자에게 입력과 선택을 요청

- **YAML & JSON 지원** - 선언적인 파이프라이닝을 YAML & JSON 형식으로 제공

- **변수 치환** - 워크플로우 전반에서 `{{variables}}` 사용

- **프로필** - 미리 정의한 변수로 비대화형 실행 (`tp run --profile <name>`); 프로필에 설정된 변수에 대해서는 choose/prompt 단계 생략

- **실행 히스토리** - 상세한 단계별 기록으로 과거 워크플로우 실행 추적 및 검토

- **워크플로우 스케줄링** - cron 표현식을 사용하여 지정된 시간에 워크플로우 자동 실행

## 리소스

### 문서 및 도구

- 📚 **[문서](https://task-pipeliner.racgoo.com/)** - 완전한 DSL 참조 및 가이드
- 🎨 **[워크플로우 생성기](https://task-pipeliner-generator.racgoo.com/)** - 브라우저에서 시각적으로 워크플로우 생성

### 저장소 및 패키지 관리자

- 💻 **[GitHub](https://github.com/racgoo/task-pipeliner)** - 소스 코드 및 이슈 추적
- 📦 **[npm](https://www.npmjs.com/package/task-pipeliner)** - npm 레지스트리 패키지
- 🍺 **[Homebrew](https://github.com/racgoo/homebrew-task-pipeliner)** - macOS/Linux용 Homebrew 탭
- 🪟 **[Scoop](https://github.com/racgoo/scoop-task-pipeliner)** - Windows용 Scoop 버킷

### CLI 명령어

**워크플로우 실행:**
```bash
tp run workflow.yaml        # 워크플로우 실행
tp run                      # 가장 가까운 tp 디렉토리에서 워크플로우 선택하여 실행
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
tp schedule list   # 스케줄 목록 및 데몬 상태 보기
tp schedule add schedules.yaml  # 스케줄 파일에서 스케줄 추가
tp schedule remove # 스케줄 삭제
tp schedule remove-all # 모든 스케줄 삭제
tp schedule toggle # 스케줄 활성화/비활성화
tp schedule start  # 포그라운드 모드로 스케줄러 시작
tp schedule start -d  # 백그라운드 데몬 모드로 스케줄러 시작
tp schedule stop   # 스케줄러 데몬 종료
tp schedule status # 데몬·스케줄 상태 확인 (실시간 모드; Ctrl+C는 화면만 종료, 데몬은 계속 실행)
```

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

`workflow.yaml` 또는 `workflow.json` 파일을 생성하세요:

**YAML 형식 (`workflow.yaml`):**

```yaml
name: My Workflow

steps:
  - run: echo "Hello, World!"
  
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
    run: npm run build
  
  - when:
      var:
        action: test
    run: npm test
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

더 나은 조직화를 위해 프로젝트에 `tp` 디렉토리를 만들고 모든 워크플로우 파일을 그곳에 배치할 수 있습니다. 파일을 지정하지 않고 `tp run`을 실행하면 task-pipeliner가 자동으로 가장 가까운 `tp` 디렉토리(현재 디렉토리부터 시작하여 상위로 탐색)를 찾아 대화형으로 워크플로우를 선택할 수 있게 해줍니다.

```bash
# tp 디렉토리를 만들고 워크플로우 파일 추가
mkdir tp
mv workflow.yaml tp/

# 파일을 지정하지 않고 실행 - 대화형 선택
tp run
```

이 기능은:
1. 가장 가까운 `tp` 디렉토리를 찾습니다 (현재 디렉토리 또는 상위 디렉토리)
2. 해당 디렉토리의 모든 워크플로우 파일 (`.yaml`, `.yml`, `.json`)을 나열합니다
3. 다음 기능을 제공하는 대화형 검색 가능한 메뉴를 표시합니다:
   - 타이핑하여 실시간으로 워크플로우 필터링
   - 화살표 키 (↑↓)로 탐색
   - Enter를 눌러 선택하고 실행

대화형 메뉴는 파일 이름과 워크플로우의 `name` (YAML/JSON 내용에서)을 모두 표시하여 쉽게 식별할 수 있습니다.

**사일런트 모드:**
`--silent` (또는 `-s`) 플래그는 워크플로우 실행 중 모든 콘솔 출력을 억제합니다. 다음 경우에 유용합니다:
- 종료 코드만 필요한 CI/CD 파이프라인
- 상세한 출력이 필요 없는 자동화 스크립트
- 로그의 노이즈 감소

참고: 사일런트 모드는 명령 출력, 단계 헤더, 에러 메시지를 포함한 모든 출력을 억제합니다. 워크플로우는 정상적으로 실행되며 적절한 종료 코드를 반환합니다.

## DSL 문법

### 워크플로우 구조

워크플로우 파일은 다음 구조를 가진 YAML 또는 JSON 문서입니다:

**YAML 형식:**

```yaml
name: Workflow Name                    # 선택사항: 워크플로우 표시 이름
baseDir: ./                            # 선택사항: 명령 실행 기본 디렉토리
                                      #   - 상대 경로: YAML 파일 위치 기준으로 해석
                                      #   - 절대 경로: 그대로 사용
                                      #   - 생략 시: 현재 작업 디렉토리 사용
shell:                                 # 선택사항: 모든 run 명령의 전역 쉘 설정
  - bash                               #   - 첫 번째 요소: 쉘 프로그램 (bash, zsh, sh 등)
  - -lc                                #   - 나머지: 쉘 인자 (-c, -lc 등)
                                      #   - 생략 시: 플랫폼 기본 쉘 사용
profiles:                              # 선택사항: tp run --profile <name>용 미리 설정된 변수
  - name: Test                         #   - name: 프로필 이름
    var:                               #   - var: 키-값 맵 ({{variable}} 치환 및 choose/prompt 생략에 사용)
      mode: "dev"
      label: "test-label"

steps:                                 # 필수: 실행할 단계 배열
  - some-step-1
  - some-step-2
  # ...
```

**JSON 형식:**

```json
{
  "name": "Workflow Name",             // 선택사항: 워크플로우 표시 이름
  "baseDir": "./",                     // 선택사항: 명령 실행 기본 디렉토리
                                       //   - 상대 경로: JSON 파일 위치 기준으로 해석
                                       //   - 절대 경로: 그대로 사용
                                       //   - 생략 시: 현재 작업 디렉토리 사용
  "shell": ["bash", "-lc"],           // 선택사항: 모든 run 명령의 전역 쉘 설정
                                       //   - 첫 번째 요소: 쉘 프로그램
                                       //   - 나머지: 쉘 인자
                                       //   - 생략 시: 플랫폼 기본 쉘 사용
  "profiles": [                        // 선택사항: tp run --profile <name>용 미리 설정된 변수
    { "name": "Test", "var": { "mode": "dev", "label": "test-label" } }
  ],
  "steps": [                           // 필수: 실행할 단계 배열
    { /* some-step-1 */ },
    { /* some-step-2 */ }
  ]
}
```

#### `name` (선택)
- **타입**: `string`
- **설명**: 워크플로우의 표시 이름
- **예제**: `name: "빌드 및 배포"`

#### `baseDir` (선택)
- **타입**: `string` (상대 또는 절대 경로)
- **설명**: 모든 명령 실행을 위한 기본 디렉토리
- **해석**:
  - **상대 경로** (예: `./`, `../frontend`): YAML 파일의 디렉토리를 기준으로 해석
  - **절대 경로** (예: `/home/user/project`): 그대로 사용
  - **생략 시**: `process.cwd()` (현재 작업 디렉토리) 사용
- **예제**:
  ```yaml
  baseDir: ./frontend        # YAML 파일 기준 상대 경로
  baseDir: /app/frontend     # 절대 경로
  ```

#### `shell` (선택)
- **타입**: `string`의 `array`
- **설명**: 워크플로우 내 모든 `run` 명령에 대한 전역 쉘 설정
- **형식**: `[프로그램, ...인자]` - 첫 번째 요소는 쉘 프로그램, 나머지는 인자
- **우선순위**: 스텝별 `shell` > 워크플로우 `shell` > 사용자의 현재 쉘
- **사용자의 현재 쉘** (생략 시):
  - **Linux/macOS**: `$SHELL` 환경변수 사용 (예: `/bin/zsh`, `/bin/bash`)
  - **Windows**: `%COMSPEC%` 사용 (일반적으로 `cmd.exe`)
  - **동작**: `tp run`을 실행한 쉘 환경과 동일한 환경에서 명령 실행
- **예제**:
  ```yaml
  # Unix/Linux/macOS
  shell: [bash, -lc]         # bash 로그인 쉘 사용
  shell: [zsh, -c]           # zsh 사용
  shell: [sh, -c]            # sh 사용 (POSIX)
  
  # Windows
  shell: [cmd, /c]           # 명령 프롬프트
  shell: [powershell, -Command]  # Windows PowerShell
  shell: [pwsh, -Command]    # PowerShell Core
  ```
- **크로스 플랫폼 예시**:
  - **Linux/macOS**: `[bash, -lc]`, `[zsh, -c]`, `[/bin/bash, -c]`
  - **Windows**: `[cmd, /c]`, `[powershell, -Command]`, `[pwsh, -Command]`
  - **Git Bash (Windows)**: `[bash, -c]`
  - **WSL**: `[wsl, bash, -c]` 또는 `wsl` 명령 직접 사용

#### `profiles` (선택)
- **타입**: `{ name: string, var: Record<string, string> }` 의 `array`
- **설명**: 비대화형 실행을 위한 이름 붙은 변수 세트. `tp run --profile <name>` 과 함께 사용.
- **동작**: 프로필을 사용하면, 프로필에 이미 설정된 변수에 값을 저장하는 **choose** 또는 **prompt** 단계는 생략되고, 프로필 값이 `{{variable}}` 치환 및 조건에 사용됩니다.
- **예제**:
  ```yaml
  profiles:
    - name: Test
      var:
        mode: "dev"
        label: "test-label"
    - name: Prod
      var:
        mode: "prod"
        label: "prod-label"
  ```
  ```bash
  tp run workflow.yaml --profile Test   # Test 프로필 변수 사용; mode, label에 대한 choose/prompt 생략
  ```

#### `steps` (필수)
- **타입**: `Step` 객체의 `array`
- **설명**: 순차적으로 실행할 단계 목록
- **실행**: 단계는 순서대로 하나씩 실행됩니다 (병렬이 아닌 경우)

---

### 단계 타입

`steps` 배열의 각 단계는 다음 타입 중 하나일 수 있습니다:

#### 1. `run` - 명령 실행

셸 명령을 실행합니다.

**문법:**
```yaml
- run: <command>
  when?: <condition>  # 선택: 조건이 충족될 때만 실행
  timeout?: <number>  # 선택: 타임아웃 (초 단위)
  retry?: <number> | "Infinity"  # 선택: 실패 시 재시도 횟수 (기본값: 0). "Infinity"로 무한 재시도 가능
  shell?: <array>     # 선택: 쉘 설정 (workflow.shell 오버라이드)
  continue?: <bool>   # 선택: 이 스텝 이후 다음 스텝으로 진행할지 여부 (성공/실패 무관)
  onError?:            # 선택: 에러 처리 동작
    run: <command>     # 메인 run 명령이 실패했을 때 실행할 대체 명령 (사이드 이펙트)
    timeout?: <number> # 선택: 이 fallback 명령의 타임아웃
    retry?: <number> | "Infinity"  # 선택: 이 fallback 명령의 재시도 횟수. "Infinity"로 무한 재시도 가능
    onError?: ...      # 선택: 중첩 fallback (재귀 onError 체인)
```

**속성:**
- `run` (필수): `string` - 실행할 셸 명령
- `when` (선택): `Condition` - 실행 전 확인할 조건
- `timeout` (선택): `number` - 최대 실행 시간 (초 단위). 이 시간을 초과하면 명령이 종료됩니다.
- `retry` (선택): `number | "Infinity"` - 실패 시 재시도 횟수 (기본값: 0, 재시도 없음). `"Infinity"`로 성공할 때까지 무한 재시도 가능
- `shell` (선택): `string`의 `array` - 이 스텝의 쉘 설정. 워크플로우의 전역 `shell`을 오버라이드합니다. 형식: `[프로그램, ...인자]`. 예: `[bash, -lc]`, `[zsh, -c]`.
- `continue` (선택): `boolean` - 이 스텝 완료 후 다음 스텝으로 진행할지 여부를 제어합니다 (성공/실패와 무관).
  - `continue: true` - 항상 다음 스텝으로 진행 (이 스텝이 실패해도)
  - `continue: false` - 항상 워크플로우 중단 (이 스텝이 성공해도)
  - `continue` 미설정 (기본값) - 성공 시 진행, 실패 시 중단
 - `onError.run` (선택): `string` - 메인 `run` 명령이 (자신의 재시도 후에도) 실패했을 때 실행할 대체 명령. **onError는 단순히 사이드 이펙트(예: 정리 작업, 롤백)를 수행하며, 스텝의 성공/실패 여부에는 영향을 주지 않습니다.** 메인 `run`이 실패하면 이 스텝은 실패로 간주됩니다.
 - `onError.timeout` (선택): `number` - 이 fallback 명령의 타임아웃.
 - `onError.retry` (선택): `number | "Infinity"` - 이 fallback 명령의 재시도 횟수. `"Infinity"`로 무한 재시도 가능.

**예제:**
```yaml
# 간단한 명령
steps:
  - run: npm install

  # 조건이 있는 명령
  - when:
      file: ./package.json
    run: npm install

  # 변수 입력
  - choose:
      message: 실행알 모드를 선택하세요.
      options:
        - id: 1.1.1
          label: 1.1.1 버전 (display 영역에 표시될 문자열)
        - id: 1.1.2
          label: 1.1.2 버전 (display 영역에 표시될 문자열)
        - id: 1.1.3
          label: 1.1.3 버전 (display 영역에 표시될 문자열)
      as: version

  # 변수 치환이 있는 명령
  - run: echo "Building {{version}}"

  # 타임아웃이 있는 명령 (30초)
  - run: npm install
    timeout: 30

  # 재시도가 있는 명령 (최대 3번 재시도)
  - run: npm install
    retry: 3

  # 무한 재시도 명령 (성공할 때까지 재시도)
  - run: npm install
    retry: Infinity

  # PM2처럼 프로세스 관리: 서버가 죽으면 자동 재시작
  - run: node server.js
    retry: Infinity

  # 타임아웃과 재시도 모두 사용
  - run: npm install
    timeout: 60
    retry: 2

  # 실패 시 fallback 명령 실행
  - run: pnpm lint
    onError:
      run: pnpm lint:fix

  # 여러 단계로 이어지는 fallback 체인
  - run: step1
    onError:
      run: step2
      onError:
        run: step3

  # 실패를 기록만 하고 워크플로우는 계속 진행
  - run: pnpm typecheck
    continue: true
    onError:
      run: echo "Type check failed, but continuing..."

  # 커스텀 쉘 사용 (스텝별)
  - run: echo $SHELL
    shell:
      - zsh
      - -c

  # bash 로그인 쉘 사용
  - run: source ~/.bashrc && echo "프로필 로드됨"
    shell:
      - bash
      - -lc
```

**동작:**
- 명령은 `baseDir` (지정된 경우) 또는 현재 작업 디렉토리에서 실행됩니다
- 메인 `run` 명령의 성공/실패 여부가 이 스텝의 최종 결과를 결정합니다. `onError`는 단순히 실패 시 추가 작업(정리, 롤백 등)을 수행할 뿐이며, 스텝의 성공 여부를 변경하지 않습니다.
- `continue` 플래그는 이 스텝 완료 후 워크플로우 실행을 제어합니다:
  - `continue: true` - 항상 다음 스텝으로 진행 (성공/실패 무관)
  - `continue: false` - 항상 워크플로우 중단 (성공/실패 무관)
  - `continue` 미설정 - 기본 동작: 성공 시 진행, 실패 시 중단
- 출력은 CLI 포맷팅과 함께 실시간으로 표시됩니다
- `timeout`이 지정되면 명령이 시간 제한을 초과하면 종료되고 단계가 실패합니다
- `retry`가 지정되면 성공할때 까지 retry 값 만큼 재시도됩니다

---

#### 2. `choose` - 사용자 선택

옵션 목록에서 사용자가 선택하도록 프롬프트를 표시합니다. 선택 메뉴에는 **실시간 검색 기능**이 포함되어 있어 타이핑으로 옵션을 필터링할 수 있습니다.

**문법:**
```yaml
steps:
  - choose:
      message: <string>              # 필수: 표시할 질문
      options:                        # 필수: 옵션 배열
        - id: <string>                # 필수: 고유 식별자 (값으로 저장됨)
          label: <string>             # 필수: 표시 텍스트
        - id: <string>
          label: <string>
      as: <variable-name>             # 선택: 결과를 저장할 변수 이름
    when: <condition>                 # 초이스 프롬프트 제공 조건
```

**속성:**
- `choose.message` (필수): `string` - 사용자에게 표시할 질문 텍스트
- `choose.options` (필수): 다음을 가진 객체의 `array`:
  - `id` (필수): `string` - 고유 식별자 (이 값이 저장됨)
  - `label` (필수): `string` - 사용자에게 표시할 텍스트
- `choose.as` (선택): `string` - 선택된 `id`를 저장할 변수 이름
  - 생략 시: choice는 `id`로 저장됩니다 (하위 호환성을 위해)
  - 제공 시: 선택된 `id`가 이 변수 이름으로 저장됩니다
- `when` (선택): `Condition` - 조건이 충족될 때만 선택 프롬프트 표시

**대화형 기능:**
- **실시간 검색**: 타이핑하여 옵션을 즉시 필터링 - 매칭되는 옵션만 표시됩니다
- **화살표 키 탐색**: ↑↓ 키를 사용하여 옵션 간 탐색
- **Enter로 선택**: Enter를 눌러 선택 확인
- **Backspace**: 검색어에서 문자 제거
- **Escape**: 검색어를 지우고 모든 옵션 표시

**예제:**
```yaml
# 기본 선택
- choose:
    message: "환경을 선택하세요:"
    options:
      - id: dev
        label: "개발"
      - id: staging
        label: "스테이징"
      - id: prod
        label: "프로덕션"

# 변수 저장이 있는 선택
- choose:
    message: "환경을 선택하세요:"
    options:
      - id: dev
        label: "개발"
      - id: prod
        label: "프로덕션"
    as: env  # 선택된 id가 'env' 변수에 저장됨

# 조건부 선택
- when:
    file: ./package.json
  choose:
    message: "테스트를 실행하시겠습니까?"
    options:
      - id: yes
        label: "예"
      - id: no
        label: "아니오"
    as: runTests
```

**저장:**
- 선택된 옵션의 `id`는 다음으로 저장됩니다:
  1. choice ( `hasChoice(id)`로 접근 가능)
  2. `id` 이름을 가진 변수 (하위 호환성을 위해)
  3. `as`가 제공된 경우: `as` 이름을 가진 변수로도 저장됨

**조건에서 사용:**
```yaml
# 'as: env'가 있는 choice 후
- when:
    var:         # 변수를 사용한다는 정의
      env: prod  # 'env' 변수가 'prod'와 같은지 확인
  run: echo "프로덕션에 배포 중"
```

---

#### 3. `prompt` - 텍스트 입력

사용자에게 텍스트 입력을 요청합니다.

**문법:**
```yaml
- prompt:
    message: <string>              # 필수: 표시할 질문
    as: <variable-name>            # 필수: 결과를 저장할 변수 이름
    default: <string>              # 선택: 기본값
  when: <condition>               # 선택: 조건이 충족될 때만 프롬프트 표시
```

**속성:**
- `prompt.message` (필수): `string` - 사용자에게 표시할 질문 텍스트
- `prompt.as` (필수): `string` - 입력 값을 저장할 변수 이름
- `prompt.default` (선택): `string` - 사용자가 입력 없이 Enter를 누를 때의 기본값
- `when` (선택): `Condition` - 조건이 충족될 때만 프롬프트 표시

**예제:**
```yaml
# 기본 프롬프트
- prompt:
    message: "버전 번호를 입력하세요:"
    as: version

# 기본값이 있는 프롬프트
- prompt:
    message: "버전 번호를 입력하세요:"
    as: version
    default: "1.0.0"

# 조건부 프롬프트
- when:
    var:
      env: prod
  prompt:
    message: "프로덕션 배포 사유를 입력하세요:"
    as: deployReason
```

**저장:**
- 사용자 입력은 `as`에 지정된 이름의 변수로 저장됩니다
- `{{variable}}` 문법으로 명령에서 사용할 수 있습니다
- `var` 조건으로 조건에서 확인할 수 있습니다

**사용:**
```yaml
# 명령에서 사용
- run: echo "Building version {{version}}"

# 조건에서 확인
- when:
    var:
      version: "1.0.0"
  run: echo "안정 버전 배포 중"
```

---

#### 4. `parallel` - 병렬 실행

여러 단계를 동시에 실행합니다. `steps`와 마찬가지로 `parallel`은 내부에 step 배열을 가지며, 각 step은 `-`로 시작합니다. 이 step들이 모두 동시에 실행됩니다.

**문법:**
```yaml
- parallel:
    - <step1>  # 각 step은 `-`로 시작하며, `steps`와 동일한 형식
    - <step2>
    - <step3>
  when?: <condition>  # 선택: 조건이 충족될 때만 병렬 블록 실행
```

**속성:**
- `parallel` (필수): 단계들의 `array` - 병렬로 실행할 단계. **`run`, 중첩 `parallel`, `fail` 스텝만 허용됩니다.** `choose`와 `prompt`(사용자 입력 스텝)는 `parallel` **안에서 사용할 수 없습니다**—사용자 입력은 병렬로 실행되지 않습니다.
- `when` (선택): `Condition` - 조건이 충족될 때만 병렬 블록 실행

**제한:** `parallel` 내부의 스텝은 `run`, 중첩 `parallel`, `fail`만 사용할 수 있습니다. `parallel` 안에서 `choose`나 `prompt`를 사용하면 안 되며, 워크플로우 검증 시 에러가 발생합니다 (예: `'choose' step is not allowed inside 'parallel' block`).

**예제:**
```yaml
# 기본 병렬 실행
# parallel 내부의 각 step은 `-`로 시작하며, `steps`와 동일한 형식
- parallel:
    - run: npm run test:unit
    - run: npm run test:integration
    - run: npm run lint

# 조건이 있는 병렬
# 각 step은 자신만의 `when` 조건을 가질 수 있습니다
- parallel:
    - when:
          file: ./src
        run: echo "프론트엔드 빌드 중..."
    - when:
          file: ./api
        run: echo "백엔드 빌드 중..."

# 조건부 병렬 블록
# 전체 parallel 블록에 `when` 조건을 적용할 수 있습니다
- when:
    var:
      env: staging
  parallel:
    - run: npm run test
    - run: npm run lint

# 중첩 parallel (허용); parallel 내부에는 run / parallel / fail만 사용
- parallel:
    - run: npm run test
    - parallel:
        - run: npm run lint
        - run: npm run typecheck
```

**동작:**
- `parallel` 배열의 모든 단계가 동시에 실행을 시작합니다
- 워크플로우는 모든 병렬 단계가 완료될 때까지 기다립니다
- 어떤 단계라도 실패하면 워크플로우가 중지됩니다
- 각 병렬 브랜치는 자체 격리된 워크스페이스 상태를 가집니다 (복제됨)
- **`choose`와 `prompt`는 `parallel` 안에서 사용할 수 없습니다** (사용자 입력은 병렬로 실행되지 않음; `parallel` 블록 앞뒤의 순차 스텝에서만 사용하세요)

---

#### 5. `fail` - 워크플로우 실패

오류 메시지와 함께 워크플로우를 중지합니다.

**문법:**
```yaml
- fail:
    message: <string>
  when?: <condition>  # 선택: 조건이 충족될 때만 실패
```

**속성:**
- `fail.message` (필수): `string` - 표시할 오류 메시지
- `when` (선택): `Condition` - 조건이 충족될 때만 실패

**예제:**
```yaml
# 파일이 없으면 실패
- when:
    not:
      file: ./dist
  fail:
    message: "빌드 출력을 찾을 수 없습니다"

# 변수 기반 실패
- when:
    var:
      env: prod
  fail:
    message: "승인 없이는 프로덕션에 배포할 수 없습니다"
```

**동작:**
- 워크플로우 실행을 즉시 중지합니다
- 오류 메시지를 표시합니다
- 0이 아닌 상태 코드로 종료합니다

---

### 조건 (`when` 절)

조건은 단계가 실행되는 시점을 제어합니다. 모든 조건은 워크스페이스 상태에 대한 질문으로 평가됩니다.

#### 조건 타입

##### 1. 파일 존재 (`file`)

파일 또는 디렉토리가 존재하는지 확인합니다.

**문법:**
```yaml
when:
  file: <path>
```

**속성:**
- `file`: `string` - 파일 또는 디렉토리 경로 (현재 작업 디렉토리 기준)

**예제:**
```yaml
- when:
    file: ./dist
  run: echo "빌드가 존재합니다"

- when:
    file: ./package.json
  run: npm install

- when:
    not:
      file: ./node_modules
  run: npm install
```

**동작:**
- 경로는 `process.cwd()` (현재 작업 디렉토리) 기준으로 해석됩니다
- 파일 또는 디렉토리가 존재하면 `true`, 그렇지 않으면 `false`를 반환합니다

---

##### 2. 변수 값 비교 (`var` 객체)

변수가 특정 값과 같은지 확인합니다.

**문법:**
```yaml
when:
  var:
    <variable-name>: <expected-value>
```

**속성:**
- `var`: `object` - 변수 이름을 키로, 예상 값을 값으로 가진 객체
- 키: 변수 이름 (`prompt.as` 또는 `choose.as`에서)
- 값: 비교할 예상 문자열 값

**예제:**
```yaml
# env 변수가 'prod'와 같은지 확인
- when:
    var:
      env: prod
  run: echo "프로덕션에 배포 중"

# version이 특정 값과 같은지 확인
- when:
    var:
      version: "1.0.0"
  run: echo "안정 버전 배포 중"

# 여러 변수 확인 (모두 일치해야 함)
- when:
    var:
      env: staging
      version: "2.0.0"
  run: echo "스테이징에 v2.0.0 배포 중"
```

**동작:**
- 변수 값(문자열)을 예상 값과 비교합니다
- 값이 정확히 일치하면 `true`를 반환합니다 (대소문자 구분)
- 변수가 존재하지 않거나 값이 일치하지 않으면 `false`를 반환합니다
- 객체의 모든 키-값 쌍이 일치해야 합니다 (AND 논리)

---

##### 3. 변수 존재 (`var` 문자열)

변수가 존재하는지 확인합니다 (값과 무관하게).

**문법:**
```yaml
when:
  var: <variable-name>
# 또는
when:
  has: <variable-name>  # var의 별칭
```

**속성:**
- `var` 또는 `has`: `string` - 확인할 변수 이름

**예제:**
```yaml
# 변수가 존재하는지 확인
- when:
    var: version
  run: echo "Version: {{version}}"

# 'has' 별칭 사용
- when:
    has: projectName
  run: echo "Project: {{projectName}}"
```

**동작:**
- 변수가 존재하면 `true`를 반환합니다 (`prompt.as` 또는 `choose.as`에서)
- 변수가 존재하지 않으면 `false`를 반환합니다
- 값을 확인하지 않고 존재 여부만 확인합니다

---

##### 4. 결합된 조건

`all`, `any`, `not`을 사용하여 여러 조건을 결합합니다.

###### `all` - AND 논리

모든 조건이 참이어야 합니다.

**문법:**
```yaml
when:
  all:
    - <condition1>
    - <condition2>
    - <condition3>
```

**예제:**
```yaml
- when:
    all:
      - file: ./dist
      - var:
          env: production
  run: echo "프로덕션 빌드 준비 완료"

- when:
    all:
      - var:
          env: staging
      - var:
          version: "2.0.0"
      - file: ./dist
  run: echo "스테이징에 v2.0.0 배포 중"
```

**동작:**
- 배열의 모든 조건이 `true`일 때만 `true`를 반환합니다
- 어떤 조건이라도 `false`이면 `false`를 반환합니다
- 단락 평가: 첫 번째 `false` 후 확인을 중지합니다

---

###### `any` - OR 논리

어떤 조건이라도 참일 수 있습니다.

**문법:**
```yaml
when:
  any:
    - <condition1>
    - <condition2>
    - <condition3>
```

**예제:**
```yaml
- when:
    any:
      - var:
          env: staging
      - var:
          env: production
  run: echo "서버에 배포 중"

- when:
    any:
      - file: ./dist
      - file: ./build
  run: echo "빌드 출력을 찾았습니다"
```

**동작:**
- 배열의 어떤 조건이라도 `true`이면 `true`를 반환합니다
- 모든 조건이 `false`일 때만 `false`를 반환합니다
- 단락 평가: 첫 번째 `true` 후 확인을 중지합니다

---

###### `not` - 부정

조건을 부정합니다.

**문법:**
```yaml
when:
  not:
    <condition>
```

**예제:**
```yaml
# 파일이 없으면 실패
- when:
    not:
      file: ./dist
  fail:
    message: "빌드 출력을 찾을 수 없습니다"

# 변수가 값과 같지 않으면 실행
- when:
    not:
      var:
        env: prod
  run: echo "프로덕션 환경이 아닙니다"

# 복잡한 부정
- when:
    not:
      all:
        - file: ./dist
        - var:
            env: prod
  run: echo "프로덕션 준비가 되지 않았습니다"
```

**동작:**
- 내부 조건이 `false`이면 `true`를 반환합니다
- 내부 조건이 `true`이면 `false`를 반환합니다
- 모든 조건 타입을 부정할 수 있습니다

---

##### 5. 중첩된 조건

조건을 중첩하여 복잡한 논리를 만들 수 있습니다.

**예제:**
```yaml
# 복잡한 중첩 조건
- when:
    all:
      - file: ./dist
      - any:
          - var:
              env: staging
          - var:
              env: production
      - not:
          var:
            version: "0.0.0"
  run: echo "배포 준비 완료"

# 여러 수준의 중첩
- when:
    any:
      - all:
          - var:
              env: prod
          - file: ./dist
      - all:
          - var:
              env: staging
          - not:
              file: ./test-results
  run: echo "조건부 배포"
```

---

### 변수 치환

변수는 `{{variable}}` 문법을 사용하여 명령에서 사용할 수 있습니다. 선택적으로 공백을 사용할 수 있습니다: `{{var}}`, `{{ var }}`, `{{  var  }}` 모두 작동합니다.

**문법:**
```yaml
run: echo "{{variableName}}"
# 또는 선택적으로 공백 사용
run: echo "{{ variableName }}"
```

**⚠️ 중요: YAML 문법 규칙**

명령어에서 `{{variable}}`을 사용할 때, 파싱 오류를 방지하기 위해 다음 규칙을 따르세요:

✅ **안전한 패턴:**
```yaml
# 단어로 시작 (따옴표 불필요)
- run: echo "Building {{version}}..."
- run: npm run build --version={{version}}

# 전체 명령어를 작은따옴표로 감싸기
- run: 'echo "Selected: {{mode}}"'
```

❌ **문제가 되는 패턴:**
```yaml
# 금지: 따옴표 + 변수 앞 콜론
- run: echo "mode: {{mode}}"        # ❌ YAML 파싱 에러!

# 해결: 전체 명령어를 작은따옴표로 감싸기
- run: 'echo "mode: {{mode}}"'      # ✅ 정상 작동
```

**예제:**
```yaml
# 프롬프트 변수 사용
- prompt:
    message: "프로젝트 이름을 입력하세요:"
    as: projectName
- run: echo "Building {{projectName}}..."

# 선택 변수 사용
- choose:
    message: "환경을 선택하세요:"
    options:
      - id: dev
        label: "개발"
    as: env
- run: echo "Deploying to {{env}}"

# 여러 변수
- run: echo "Building {{projectName}} version {{version}} for {{env}}"
```

**동작:**
- 변수는 문자열 값으로 대체됩니다
- 변수가 존재하지 않으면 빈 문자열로 대체됩니다
- 변수는 실행 시점에 해석됩니다

---

### 완전한 예제

모든 기능을 보여주는 완전한 예제입니다:

```yaml
name: Complete Workflow Example
baseDir: ./

steps:
  # 1. 간단한 명령
  - run: echo "워크플로우 시작 중..."

  # 2. 변수 저장이 있는 사용자 선택
  - choose:
      message: "배포 환경을 선택하세요:"
      options:
        - id: dev
          label: "개발"
        - id: staging
          label: "스테이징"
        - id: prod
          label: "프로덕션"
      as: env

  # 3. 변수 값 기반 조건부 단계
  - when:
      var:
        env: prod
    prompt:
      message: "프로덕션 배포 사유를 입력하세요:"
      as: deployReason

  # 4. 변수 값 비교
  - when:
      var:
        env: dev
    run: echo "개발 환경에 배포 중..."

  - when:
      var:
        env: staging
    run: echo "스테이징에 배포 중..."

  # 5. 복잡한 조건 (all)
  - when:
      all:
        - var:
            env: prod
        - var: deployReason
        - file: ./dist
    run: echo "프로덕션 배포 승인됨"

  # 6. 병렬 실행
  - parallel:
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run lint

  # 6.5. 스텝별 쉘 오버라이드
  - run: echo "zsh로 실행"
    shell: [zsh, -c]  # 이 스텝만 워크플로우 쉘 오버라이드

  # 7. 파일 존재 확인
  - when:
      file: ./test-results
    run: echo "테스트 완료"

  # 8. 결합된 조건 (any)
  - when:
      any:
        - var:
            env: staging
        - var:
            env: prod
    run: echo "서버에 배포 중..."

  # 9. 부정
  - when:
      not:
        file: ./dist
    fail:
      message: "빌드 출력을 찾을 수 없습니다"

  # 10. 변수 치환
  - run: echo "Deploying {{projectName}} version {{version}} to {{env}}"
```

---

## 📜 실행 히스토리 관리

task-pipeliner는 워크플로우 실행 히스토리를 자동으로 기록하여 과거 실행 내역을 검토하고, 문제를 디버깅하며, 성능을 추적할 수 있게 해줍니다.

### 히스토리 보기

모든 워크플로우 실행은 타임스탬프가 포함된 파일명으로 `~/.pipeliner/workflow-history/`에 자동으로 저장됩니다.

**인터랙티브 메뉴:**
```bash
tp history
```

이 명령은 다음 옵션을 제공하는 인터랙티브 메뉴를 엽니다:
- **Show** - 히스토리를 선택하여 보기
- **Remove** - 특정 히스토리 파일 삭제
- **Remove All** - 모든 히스토리 파일 삭제

**특정 히스토리 보기:**
```bash
tp history show
```

이 명령은:
1. 사용 가능한 모든 히스토리 파일을 나열합니다
2. 하나를 선택하여 볼 수 있게 합니다
3. 다음을 포함한 상세한 실행 정보를 표시합니다:
   - 실행 타임스탬프
   - 총 실행 시간
   - 단계별 결과 (성공/실패)
   - 명령 출력 (stdout/stderr)
   - 각 단계의 실행 시간

**출력 예시:**
```
┌─────────────────────────────────────────┐
│  Workflow Execution History             │
│                                         │
│  File: workflow-2026-01-26_21-51-17...  │
│  Started: 2026-01-26 21:51:17           │
│  Total Duration: 5.23s                  │
│  Total Steps: 3                         │
│  ✓ Successful: 2                        │
│  ✗ Failed: 1                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✓ Step 1/3 - Run                       │
│  Duration: 1.23s | Status: Success      │
│                                         │
│  Command: npm install                   │
└─────────────────────────────────────────┘
```

### 히스토리 삭제

**특정 히스토리 삭제:**
```bash
tp history remove
```

삭제할 히스토리 파일을 선택하는 인터랙티브 메뉴를 엽니다.

**모든 히스토리 삭제:**
```bash
tp history remove-all
```

저장된 모든 워크플로우 실행 히스토리를 삭제합니다. `-y` 플래그를 사용하지 않으면 확인 프롬프트가 표시됩니다:

```bash
tp history remove-all -y  # 확인 건너뛰기
```

### 히스토리 파일 형식

히스토리 파일은 `~/.pipeliner/workflow-history/`에 다음 구조로 JSON 형식으로 저장됩니다:

```json
{
  "initialTimestamp": 1706281877000,
  "records": [
    {
      "step": { "run": "npm install" },
      "output": {
        "success": true,
        "stdout": ["...", "..."],
        "stderr": []
      },
      "duration": 1234,
      "status": "success"
    }
  ]
}
```

각 레코드는 다음을 포함합니다:
- **step**: 실행된 단계 정의
- **output**: 명령 출력 (stdout/stderr) 및 성공 상태
- **duration**: 밀리초 단위의 실행 시간
- **status**: `"success"` 또는 `"failure"`

---

## ⏰ 워크플로우 스케줄링

cron 표현식을 사용하여 지정된 시간에 워크플로우를 자동으로 실행하도록 예약할 수 있습니다.

### 스케줄 추가

스케줄을 정의하는 스케줄 파일(YAML 또는 JSON)을 생성하세요:

**YAML (`schedules.yaml`):**
```yaml
schedules:
  - name: Daily Build          # 스케줄 별칭 (구분용)
    cron: "0 9 * * *"          # Cron 표현식
    workflow: ./build.yaml     # 스케줄 파일 기준 상대 경로

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true               # 선택사항: 무음 모드로 실행

  - name: Production Deploy
    cron: "0 18 * * 5"         # 매주 금요일 오후 6시
    workflow: ./deploy.yaml
    profile: Production        # 선택사항: 특정 프로필 사용

  - name: Hourly Check
    cron: "0 * * * *"
    workflow: simple.yaml
    baseDir: /path/to/workflows  # 선택사항: 워크플로우 경로의 기준 디렉토리

  - name: Daily UTC
    cron: "0 9 * * *"
    workflow: ./daily.yaml
    timezone: 0                   # 선택사항: UTC 오프셋(시간). +9, -5, 0. 생략 시 시스템 로컬
```

**필드 설명:**
- `name`: 스케줄을 구분하기 위한 별칭
- `cron`: 실행 시간 (cron 표현식)
- `workflow`: 워크플로우 파일 경로 (스케줄 파일 또는 `baseDir` 기준 상대 경로, 또는 절대 경로)
- `baseDir`: (선택사항) 워크플로우 경로의 기준 디렉토리 (기본값: 스케줄 파일 디렉토리)
- `timezone`: (선택사항) UTC 오프셋(시간). 숫자 또는 문자열 (예: `+9`, `-5`, `0`). 생략 시 시스템 로컬
- `silent`: (선택사항) 무음 모드로 실행 (콘솔 출력 억제)
- `profile`: (선택사항) 사용할 프로필 이름 (프로필이 있는 워크플로우용)

**경로 해석 방식:**
기본적으로 상대 워크플로우 경로는 스케줄 파일의 디렉토리를 기준으로 해석됩니다. 즉, 스케줄 파일과 워크플로우가 같은 폴더에 있으면 `./workflow.yaml`만 쓰면 됩니다. 다른 기준 디렉토리가 필요하면 `baseDir`을 사용하세요.

**JSON (`schedules.json`):**
```json
{
  "schedules": [
    {
      "name": "Daily Build",
      "cron": "0 9 * * *",
      "workflow": "./build.yaml"
    },
    {
      "name": "Nightly Test",
      "cron": "0 2 * * *",
      "workflow": "./test.yaml",
      "silent": true
    },
    {
      "name": "Production Deploy",
      "cron": "0 18 * * 5",
      "workflow": "./deploy.yaml",
      "profile": "Production"
    }
  ]
}
```

파일에서 모든 스케줄을 추가:

```bash
tp schedule add schedules.yaml
```

각 스케줄에 대해 별칭을 확인하거나 변경할 수 있습니다

**Cron 표현식 형식:**

5자리(표준) 또는 **6자리(초 포함, node-cron 확장)** 지원:

```
# 6자리 (초 선택사항)
# ┌────────────── 초 (0-59, 선택)
# │ ┌──────────── 분 (0-59)
# │ │ ┌────────── 시 (0-23)
# │ │ │ ┌──────── 일 (1-31)
# │ │ │ │ ┌────── 월 (1-12)
# │ │ │ │ │ ┌──── 요일 (0-7)
# │ │ │ │ │ │
# * * * * * *
```

**일반적인 예시 (5자리):**
- `0 9 * * *` - 매일 오전 9시
- `0 0 * * 1` - 매주 월요일 자정
- `*/15 * * * *` - 15분마다
- `0 */2 * * *` - 2시간마다

**초 포함 (6자리):**
- `* * * * * *` - 매초
- `*/5 * * * * *` - 5초마다
- `0 * * * * *` - 매분 (5자리 `* * * * *`와 동일)
- `0 9 * * 1-5` - 평일 오전 9시

### 스케줄 관리

```bash
# 모든 스케줄 목록 보기
tp schedule list

# 스케줄 삭제
tp schedule remove

# 모든 스케줄 삭제
tp schedule remove-all

# 스케줄 활성화/비활성화
tp schedule toggle
```

### 스케줄러 실행

예약된 시간에 워크플로우를 실행하려면 스케줄러를 시작하세요. 두 가지 모드로 실행할 수 있습니다:

**포그라운드 모드:**
```bash
tp schedule start
```
- 포그라운드에서 실행됩니다 (터미널에 연결됨)
- `Ctrl+C`를 눌러 스케줄러를 중지합니다
- 테스트나 임시 스케줄링에 유용합니다

**데몬 모드 (백그라운드):**
```bash
tp schedule start -d
```
- 백그라운드 데몬 프로세스로 실행됩니다
- 터미널을 닫아도 계속 실행됩니다
- 한 번에 하나의 데몬 인스턴스만 실행 가능합니다 (중복 실행 방지)
- `tp schedule stop`으로 데몬을 종료합니다

**데몬 상태 확인:**
```bash
tp schedule status      # 실시간 보기 (1초마다 갱신); Ctrl+C는 화면만 종료, 데몬은 유지
tp schedule status -n   # 한 번만 표시 후 종료 (갱신 없음)
```
- 데몬·스케줄 상태를 `tp schedule list`, `tp schedule start`와 동일한 카드 레이아웃으로 표시
- 표시 내용: 데몬 상태(active/inactive), PID, 시작 시각·업타임, 각 스케줄의 Enabled/Cron/Timezone/Workflow/Profile/Last run/Next run
- `Ctrl+C`로 상태 화면만 종료 (데몬은 `tp schedule start -d`로 띄웠다면 계속 실행됨)

스케줄러는:
- 예약된 시간에 워크플로우를 실행합니다
- 모든 실행을 `~/.pipeliner/workflow-history/`에 기록합니다
- 중복 데몬 인스턴스 실행을 방지합니다 (한 번에 하나만 실행 가능)

### 스케줄 저장

스케줄은 `~/.pipeliner/schedules/schedules.json`에 저장됩니다. 각 스케줄은 다음을 포함합니다:
- 고유 ID
- 워크플로우 경로
- Cron 표현식
- 활성화/비활성화 상태
- 마지막 실행 시간

예약된 모든 워크플로우 실행은 수동 실행과 동일한 히스토리 디렉토리(`~/.pipeliner/workflow-history/`)에 기록되므로, `tp history`를 사용하여 검토할 수 있습니다.

---

## 📚 예제

### 프로젝트 예제

완전한 프로젝트 예제는 `examples/` 디렉토리를 확인하세요:

- **`monorepo-example/`** - 여러 프로젝트가 있는 모노레포 워크플로우
- **`simple-project/`** - 간단한 단일 프로젝트 워크플로우
- **`react-app/`** - React 애플리케이션 빌드 및 배포

### YAML 예제

`examples/yaml-examples/`에서 YAML 워크플로우 예제를 확인하세요:

- **`basic.yaml`** - 선택과 조건이 있는 기본 워크플로우
- **`simple.yaml`** - 최소한의 워크플로우 예제
- **`parallel.yaml`** - 병렬 실행 예제
- **`conditions.yaml`** - 다양한 조건 타입
- **`file-checks.yaml`** - 파일 존재 확인
- **`prompt.yaml`** - 사용자 입력 프롬프트
- **`variables.yaml`** - 변수 치환 예제
- **`profiles-example.yaml`** - 비대화형 실행용 프로필 (`tp run --profile <name>`)

### JSON 예제

`examples/json-examples/`에서 JSON 워크플로우 예제를 확인하세요 (YAML 예제와 동일):

- **`basic.json`** - 선택과 조건이 있는 기본 워크플로우
- **`simple.json`** - 최소한의 워크플로우 예제
- **`parallel.json`** - 병렬 실행 예제
- **`conditions.json`** - 조건 평가 예제
- **`prompt.json`** - 사용자 입력 프롬프트
- **`variables.json`** - 변수 치환 예제
- **`profiles-example.json`** - 비대화형 실행용 프로필 (`tp run --profile <name>`)

**참고:** YAML과 JSON 형식 모두 완전히 지원됩니다. 선호하는 형식을 선택하세요 - 가독성을 위해 YAML, 프로그래밍 방식 생성을 위해 JSON.
- **`variables.yaml`** - 변수 사용 예제
- **`prompt.yaml`** - 텍스트 프롬프트 예제
- **`var-value-example.yaml`** - 변수 값 비교 예제
- **`choice-as-example.yaml`** - 선택에서 `as` 키워드 사용
- **`base-dir-example.yaml`** - baseDir 설정 예제
- **`timeout-retry-example.yaml`** - 타임아웃 및 재시도 기능
- **`cicd.yaml`** - CI/CD 파이프라인 예제
- **`advanced.yaml`** - 고급 워크플로우 패턴
- **`multi-choice.yaml`** - 여러 순차적 선택
- **`react.yaml`** - React 전용 워크플로우

## 아키텍처

- **CLI**: Commander.js를 사용한 Node.js + TypeScript
- **작업 실행**: 스트리밍 출력이 있는 Node.js 자식 프로세스
- **UI**: 아름다운 터미널 출력을 위한 Boxen과 Chalk
- **프롬프트**: 대화형 프롬프트를 위한 Inquirer.js

## 기여하기

기여를 환영합니다! ISSUE를 남겨주세요.

## 라이선스

Copyright (c) 2026 racgoo

## 문의 및 연락

문의 사항은 lhsung98@naver.com 으로 메일 보내주세요!
