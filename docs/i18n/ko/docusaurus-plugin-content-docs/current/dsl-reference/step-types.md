# 단계 타입

워크플로우에서 사용할 수 있는 단계 타입을 설명합니다.

## 개요

`steps` 배열의 각 단계는 다음 타입 중 하나일 수 있습니다:

1. **`run`** - 셸 명령 실행
2. **`choose`** - 사용자 선택 메뉴
3. **`prompt`** - 사용자 텍스트 입력
4. **`parallel`** - 병렬 실행
5. **`fail`** - 워크플로우 실패

## 1. `run` - 명령 실행

셸 명령을 실행합니다.

### 문법

```yaml
- run: <command>
  when?: <condition>  # 선택: 조건이 충족될 때만 실행
  timeout?: <number>  # 선택: 타임아웃 (초 단위)
  retry?: <number>    # 선택: 실패 시 재시도 횟수 (기본값: 0)
  continue?: <bool>   # 선택: 이 스텝 이후 다음 스텝으로 진행할지 여부 (성공/실패 무관)
  onError?:            # 선택: 에러 처리 동작
    run: <command>     # 메인 run 명령이 실패했을 때 실행할 대체 명령 (사이드 이펙트)
    timeout?: <number> # 선택: 이 fallback 명령의 타임아웃
    retry?: <number>   # 선택: 이 fallback 명령의 재시도 횟수
    onError?: ...      # 선택: 중첩 fallback (재귀 onError 체인)
```

```json
{
  "run": "<command>",
  "when": { /* condition */ },  // 선택
  "timeout": <number>,          // 선택
  "retry": <number>             // 선택
}
```

### 속성

- `run` (필수): `string` - 실행할 셸 명령
- `when` (선택): `Condition` - 실행 전 확인할 조건
- `timeout` (선택): `number` - 최대 실행 시간 (초 단위). 이 시간을 초과하면 명령이 종료됩니다.
- `retry` (선택): `number` - 실패 시 재시도 횟수 (기본값: 0, 재시도 없음)
- `continue` (선택): `boolean` - 이 스텝 완료 후 다음 스텝으로 진행할지 여부를 제어합니다 (성공/실패와 무관).
  - `continue: true` - 항상 다음 스텝으로 진행 (이 스텝이 실패해도)
  - `continue: false` - 항상 워크플로우 중단 (이 스텝이 성공해도)
  - `continue` 미설정 (기본값) - 성공 시 진행, 실패 시 중단
- `onError.run` (선택): `string` - 메인 `run` 명령이 (자신의 재시도 후에도) 실패했을 때 실행할 대체 명령. **`onError`는 단순히 사이드 이펙트(예: 정리 작업, 롤백, 로깅)를 수행하며, 이 스텝의 성공/실패 여부를 바꾸지 않습니다.** 메인 `run`이 실패하면 이 스텝은 항상 실패로 간주됩니다.
- `onError.timeout` (선택): `number` - 이 fallback 명령의 타임아웃.
- `onError.retry` (선택): `number` - 이 fallback 명령의 재시도 횟수.

### 예제

```yaml
# 간단한 명령
steps:
  - run: npm install

# 조건이 있는 명령
- when:
    file: ./package.json
  run: npm install

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
```

### 동작

- 명령은 `baseDir` (지정된 경우) 또는 현재 작업 디렉토리에서 실행됩니다
- 메인 `run` 명령의 성공/실패 여부가 이 스텝의 최종 결과를 결정합니다. `onError`는 단순히 실패 시 추가 작업(정리, 롤백, 로깅 등)을 수행할 뿐이며, 스텝의 성공 여부를 변경하지 않습니다.
- `continue` 플래그는 이 스텝 완료 후 워크플로우 실행을 제어합니다:
  - `continue: true` - 항상 다음 스텝으로 진행 (성공/실패 무관)
  - `continue: false` - 항상 워크플로우 중단 (성공/실패 무관)
  - `continue` 미설정 - 기본 동작: 성공 시 진행, 실패 시 중단
- 출력은 CLI 포맷팅과 함께 실시간으로 표시됩니다
- `timeout`이 지정되면 명령이 시간 제한을 초과하면 종료되고 단계가 실패합니다
- `retry`가 지정되면 성공할 때까지 retry 값 만큼 재시도됩니다

---

## 2. `choose` - 사용자 선택

옵션 목록에서 사용자가 선택하도록 프롬프트를 표시합니다. 선택 메뉴에는 **실시간 검색 기능**이 포함되어 있어 타이핑으로 옵션을 필터링할 수 있습니다.

### 문법

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
    when: <condition>                 # 선택: 조건이 충족될 때만 선택 프롬프트 표시
```

```json
{
  "choose": {
    "message": "<string>",
    "options": [
      {
        "id": "<string>",
        "label": "<string>"
      }
    ],
    "as": "<variable-name>"  // 선택
  },
  "when": { /* condition */ }  // 선택
}
```

### 속성

- `choose.message` (필수): `string` - 사용자에게 표시할 질문 텍스트
- `choose.options` (필수): 다음을 가진 객체의 `array`:
  - `id` (필수): `string` - 고유 식별자 (이 값이 저장됨)
  - `label` (필수): `string` - 사용자에게 표시할 텍스트
- `choose.as` (선택): `string` - 선택된 `id`를 저장할 변수 이름
  - 생략 시: choice는 `id`로 저장됩니다 (하위 호환성을 위해)
  - 제공 시: 선택된 `id`가 이 변수 이름으로 저장됩니다
- `when` (선택): `Condition` - 조건이 충족될 때만 선택 프롬프트 표시

### 대화형 기능

선택 메뉴는 향상된 대화형 경험을 제공합니다:

- **실시간 검색**: 타이핑하여 옵션을 즉시 필터링 - 매칭되는 옵션만 표시됩니다
- **화살표 키 탐색**: ↑↓ 키를 사용하여 옵션 간 탐색
- **Enter로 선택**: Enter를 눌러 선택 확인
- **Backspace**: 검색어에서 문자 제거
- **Escape**: 검색어를 지우고 모든 옵션 표시

### 예제

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

### 저장

선택된 옵션의 `id`는 다음으로 저장됩니다:

1. choice (`hasChoice(id)`로 접근 가능)
2. `id` 이름을 가진 변수 (하위 호환성을 위해)
3. `as`가 제공된 경우: `as` 이름을 가진 변수로도 저장됨

### 조건에서 사용

```yaml
# 'as: env'가 있는 choice 후
- when:
    var:         # 변수를 사용한다는 정의
      env: prod  # 'env' 변수가 'prod'와 같은지 확인
  run: echo "프로덕션에 배포 중"
```

---

## 3. `prompt` - 텍스트 입력

사용자에게 텍스트 입력을 요청합니다.

### 문법

```yaml
- prompt:
    message: <string>              # 필수: 표시할 질문
    as: <variable-name>            # 필수: 결과를 저장할 변수 이름
    default: <string>              # 선택: 기본값
  when: <condition>               # 선택: 조건이 충족될 때만 프롬프트 표시
```

```json
{
  "prompt": {
    "message": "<string>",
    "as": "<variable-name>",
    "default": "<string>"  // 선택
  },
  "when": { /* condition */ }  // 선택
}
```

### 속성

- `prompt.message` (필수): `string` - 사용자에게 표시할 질문 텍스트
- `prompt.as` (필수): `string` - 입력 값을 저장할 변수 이름
- `prompt.default` (선택): `string` - 사용자가 입력 없이 Enter를 누를 때의 기본값
- `when` (선택): `Condition` - 조건이 충족될 때만 프롬프트 표시

### 예제

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

### 저장

- 사용자 입력은 `as`에 지정된 이름의 변수로 저장됩니다
- `{{variable}}` 문법으로 명령에서 사용할 수 있습니다
- `var` 조건으로 조건에서 확인할 수 있습니다

### 사용

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

## 4. `parallel` - 병렬 실행

여러 단계를 동시에 실행합니다. `steps`와 마찬가지로 `parallel`은 내부에 step 배열을 가지며, 각 step은 `-`로 시작합니다. 이 step들이 모두 동시에 실행됩니다.

### 문법

```yaml
- parallel:
    - <step1>  # 각 step은 `-`로 시작하며, `steps`와 동일한 형식
    - <step2>
    - <step3>
  when?: <condition>  # 선택: 조건이 충족될 때만 병렬 블록 실행
```

```json
{
  "parallel": [
    { /* step1 */ },
    { /* step2 */ },
    { /* step3 */ }
  ],
  "when": { /* condition */ }  // 선택
}
```

### 속성

- `parallel` (필수): 단계들의 `array` - 병렬로 실행할 단계. **`run`, 중첩 `parallel`, `fail` 스텝만 허용됩니다.** `choose`와 `prompt`는 `parallel` **안에서 사용할 수 없습니다** (사용자 입력은 병렬로 실행되지 않음).
- `when` (선택): `Condition` - 조건이 충족될 때만 병렬 블록 실행

**제한:** `parallel` 안에서 `choose`나 `prompt`를 사용하면 안 되며, 워크플로우 검증 시 에러가 발생합니다.

### 예제

```yaml
# 기본 병렬 실행
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

### 동작

- `parallel` 배열의 모든 단계가 동시에 실행을 시작합니다
- 워크플로우는 모든 병렬 단계가 완료될 때까지 기다립니다
- 어떤 단계라도 실패하면 워크플로우가 중지됩니다
- 각 병렬 브랜치는 자체 격리된 워크스페이스 상태를 가집니다 (복제됨)
- **`choose`와 `prompt`는 `parallel` 안에서 사용할 수 없습니다** (순차 스텝에서만 사용하세요)

---

## 5. `fail` - 워크플로우 실패

오류 메시지와 함께 워크플로우를 중지합니다.

### 문법

```yaml
- fail:
    message: <string>
  when?: <condition>  # 선택: 조건이 충족될 때만 실패
```

```json
{
  "fail": {
    "message": "<string>"
  },
  "when": { /* condition */ }  // 선택
}
```

### 속성

- `fail.message` (필수): `string` - 표시할 오류 메시지
- `when` (선택): `Condition` - 조건이 충족될 때만 실패

### 예제

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

### 동작

- 워크플로우 실행을 즉시 중지합니다
- 오류 메시지를 표시합니다
- 0이 아닌 상태 코드로 종료합니다

---

## 다음 단계

- **[조건](/docs/dsl-reference/conditions)** - 조건부 실행 방법
- **[변수](/docs/dsl-reference/variables)** - 변수 사용법
- **[완전한 예제](/docs/dsl-reference/complete-example)** - 모든 기능을 포함한 예제
