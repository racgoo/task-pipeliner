# task-pipeliner

> 조건 기반 작업 파이프라인 실행기로 아름다운 CLI 출력을 제공합니다

**버전:** 0.1.1

![task-pipeliner-banner](https://github.com/user-attachments/assets/282f3cfc-cd0d-4767-88dd-f3abb8e71bea)

[![npm version](https://img.shields.io/npm/v/task-pipeliner)](https://www.npmjs.com/package/task-pipeliner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**task-pipeliner**는 간단한 YAML 또는 JSON 파일로 복잡한 작업 파이프라인을 정의할 수 있는 현대적인 워크플로우 자동화 도구입니다. 조건부 실행, 병렬 작업, 대화형 프롬프트, 그리고 아름다운 터미널 출력을 제공하여 빌드 스크립트, 배포 워크플로우, CI/CD 파이프라인에 완벽합니다.

## ✨ 주요 기능

-  **조건 기반 실행** - 파일 존재 여부, 사용자 선택, 환경 변수 등을 기반으로 단계 실행

- **병렬 실행** - 여러 작업을 동시에 병렬로 실행

- **대화형 프롬프트** - 실행 중 사용자에게 입력과 선택을 요청

- **YAML & JSON 지원** - 선언적인 파이프라이닝을 YAML & JSON 형식으로 제공

- **변수 치환** - 워크플로우 전반에서 `{{variables}}` 사용

## 리소스

- 📚 **[문서](https://task-pipeliner.racgoo.com/)** - 완전한 DSL 참조 및 가이드
- 🎨 **[시각적 생성기](https://task-pipeliner-generator.racgoo.com/)** - 브라우저에서 시각적으로 워크플로우 생성
- 💻 **[GitHub](https://github.com/racgoo/task-pipeliner)** - 소스 코드 및 이슈 추적
- 📦 **[npm](https://www.npmjs.com/package/task-pipeliner)** - npm 레지스트리 패키지
> **CLI 명령어**:
  ```bash
  tp open generator  # 시각적 생성기 열기
  tp open docs       # 문서 열기
  ```

## 🚀 빠른 시작

### 설치

#### 전역 설치

전역으로 설치하면 `task-pipeliner` 또는 `tp` 명령을 직접 사용할 수 있습니다:

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
```

## DSL 문법

### 워크플로우 구조

워크플로우 파일은 다음 구조를 가진 YAML 또는 JSON 문서입니다:

**YAML 형식:**

```yaml
name: Workflow Name                    # 선택사항: 워크플로우 표시 이름
description: |                         # 선택사항: 여러 줄 설명
  이 워크플로우는...
baseDir: ./                            # 선택사항: 명령 실행 기본 디렉토리
                                      #   - 상대 경로: YAML 파일 위치 기준으로 해석
                                      #   - 절대 경로: 그대로 사용
                                      #   - 생략 시: 현재 작업 디렉토리 사용

steps:                                 # 필수: 실행할 단계 배열
  - some-step-1
  - some-step-2
  # ...
```

**JSON 형식:**

```json
{
  "name": "Workflow Name",             // 선택사항: 워크플로우 표시 이름
  "description": "이 워크플로우는...",  // 선택사항: 설명
  "baseDir": "./",                     // 선택사항: 명령 실행 기본 디렉토리
                                       //   - 상대 경로: JSON 파일 위치 기준으로 해석
                                       //   - 절대 경로: 그대로 사용
                                       //   - 생략 시: 현재 작업 디렉토리 사용
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

#### `description` (선택)
- **타입**: `string` (`|`로 여러 줄 지원)
- **설명**: 워크플로우가 수행하는 작업에 대한 설명
- **예제**:
  ```yaml
  description: |
    이 워크플로우는 프로젝트를 빌드하고,
    테스트를 실행하며, 프로덕션에 배포합니다.
  ```

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
  retry?: <number>    # 선택: 실패 시 재시도 횟수 (기본값: 0)
```

**속성:**
- `run` (필수): `string` - 실행할 셸 명령
- `when` (선택): `Condition` - 실행 전 확인할 조건
- `timeout` (선택): `number` - 최대 실행 시간 (초 단위). 이 시간을 초과하면 명령이 종료됩니다.
- `retry` (선택): `number` - 실패 시 재시도 횟수 (기본값: 0, 재시도 없음)

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

  # 타임아웃과 재시도 모두 사용
  - run: npm install
    timeout: 60
    retry: 2
```

**동작:**
- 명령은 `baseDir` (지정된 경우) 또는 현재 작업 디렉토리에서 실행됩니다
- 명령이 실패하면 워크플로우가 중지됩니다 (모든 재시도 후에도 실패한 경우)
- 출력은 CLI 포맷팅과 함께 실시간으로 표시됩니다
- `timeout`이 지정되면 명령이 시간 제한을 초과하면 종료되고 단계가 실패합니다
- `retry`가 지정되면 성공할때 까지 retry 값 만큼 재시도됩니다

---

#### 2. `choose` - 사용자 선택

옵션 목록에서 사용자가 선택하도록 프롬프트를 표시합니다.

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
- `parallel` (필수): `Step` 객체의 `array` - 병렬로 실행할 단계 (`steps`와 동일한 형식, 각 step은 `-`로 시작)
- `when` (선택): `Condition` - 조건이 충족될 때만 병렬 블록 실행

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

# parallel은 모든 step 타입을 포함할 수 있습니다 (run, choose, prompt 등)
- parallel:
    - run: npm run test
    - choose:
        message: "린트를 실행하시겠습니까?"
        options:
          - id: yes
            label: "예"
          - id: no
            label: "아니오"
        as: runLint
    - prompt:
        message: "버전을 입력하세요:"
        as: version
```

**동작:**
- `parallel` 배열의 모든 단계가 동시에 실행을 시작합니다
- 워크플로우는 모든 병렬 단계가 완료될 때까지 기다립니다
- 어떤 단계라도 실패하면 워크플로우가 중지됩니다
- 각 병렬 브랜치는 자체 격리된 워크스페이스 상태를 가집니다 (복제됨)

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

변수는 `{{variable}}` 문법을 사용하여 명령에서 사용할 수 있습니다.

**문법:**
```yaml
run: echo "{{variableName}}"
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
description: |
  이 워크플로우는 모든 DSL 기능을 보여줍니다:
  - baseDir 설정
  - 사용자 선택 및 프롬프트
  - 변수 사용
  - 조건부 실행
  - 병렬 실행
  - 파일 확인

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

### JSON 예제

`examples/json-examples/`에서 JSON 워크플로우 예제를 확인하세요 (YAML 예제와 동일):

- **`basic.json`** - 선택과 조건이 있는 기본 워크플로우
- **`simple.json`** - 최소한의 워크플로우 예제
- **`parallel.json`** - 병렬 실행 예제
- **`conditions.json`** - 조건 평가 예제
- **`prompt.json`** - 사용자 입력 프롬프트
- **`variables.json`** - 변수 치환 예제

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

Copyright (c) 2024 racgoo

## 문의 및 연락

문의 사항은 lhsung98@naver.com 으로 메일 보내주세요!
