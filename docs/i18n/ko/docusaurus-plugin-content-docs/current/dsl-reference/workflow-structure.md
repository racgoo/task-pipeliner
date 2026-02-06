# 워크플로우 구조

워크플로우 파일의 기본 구조를 설명합니다.

## 워크플로우 파일 형식

task-pipeliner는 YAML과 JSON 두 가지 형식을 모두 지원합니다. 선호하는 형식을 선택하세요:

- **YAML**: 가독성이 좋고 사람이 읽고 작성하기 쉬움
- **JSON**: 프로그래밍 방식으로 생성하기 쉬움

## 기본 구조

워크플로우 파일은 다음 구조를 가진 YAML 또는 JSON 문서입니다:

**YAML 형식:**

```yaml
name: Workflow Name                    # 선택사항: 워크플로우 표시 이름
baseDir: ./                            # 선택사항: 명령 실행 기본 디렉토리
                                      #   - 상대 경로: YAML 파일 위치 기준으로 해석
                                      #   - 절대 경로: 그대로 사용
                                      #   - 생략 시: 현재 작업 디렉토리 사용
profiles:                              # 선택사항: tp run --profile <name>용 미리 설정된 변수
  - name: Test                         #   - name: 프로필 이름
    var:                               #   - var: 키-값 맵 (변수가 설정되면 choose/prompt 생략)
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
  "profiles": [                        // 선택사항: tp run --profile <name>용 미리 설정된 변수
    { "name": "Test", "var": { "mode": "dev", "label": "test-label" } }
  ],
  "steps": [                           // 필수: 실행할 단계 배열
    { /* some-step-1 */ },
    { /* some-step-2 */ }
  ]
}
```

## 필드 설명

### `name` (선택사항)

- **타입**: `string`
- **설명**: 워크플로우의 표시 이름
- **예제**: 
  ```yaml
  name: "빌드 및 배포"
  ```
  ```json
  {
    "name": "빌드 및 배포"
  }
  ```

### `baseDir` (선택사항)

- **타입**: `string` (상대 또는 절대 경로)
- **설명**: 모든 명령 실행을 위한 기본 디렉토리
- **해석**:
  - **상대 경로** (예: `./`, `../frontend`): 워크플로우 파일의 디렉토리를 기준으로 해석
  - **절대 경로** (예: `/home/user/project`): 그대로 사용
  - **생략 시**: `process.cwd()` (현재 작업 디렉토리) 사용
- **예제**:
  ```yaml
  baseDir: ./frontend        # 워크플로우 파일 기준 상대 경로
  baseDir: /app/frontend     # 절대 경로
  ```
  ```json
  {
    "baseDir": "./frontend"
  }
  ```

### `profiles` (선택사항)

- **타입**: `{ name: string, var: object }` 의 `array`
- **설명**: 비대화형 실행을 위한 이름 붙은 변수 세트. `tp run --profile <name>` 과 함께 사용.
- **동작**: 프로필을 사용하면, 프로필에 이미 설정된 변수에 값을 저장하는 **choose** 또는 **prompt** 단계는 생략되고, 프로필 값이 `{{variable}}` 치환 및 조건에 사용됩니다.
- **예제**:
  ```yaml
  profiles:
    - name: Test
      var:
        mode: "dev"
        label: "test-label"
  ```
  ```bash
  tp run workflow.yaml --profile Test
  ```

자세한 내용과 예제는 [프로필](/docs/dsl-reference/profiles) 문서를 참조하세요.

### `steps` (필수)

- **타입**: `Step` 객체의 `array`
- **설명**: 순차적으로 실행할 단계 목록
- **실행**: 단계는 순서대로 하나씩 실행됩니다 (병렬이 아닌 경우)
- **최소 개수**: 최소 1개의 단계가 필요합니다
- **예제**:
  ```yaml
  steps:
    - run: 'echo "Step 1"'
    - run: 'echo "Step 2"'
  ```
  ```json
  {
    "steps": [
      { "run": "echo \"Step 1\"" },
      { "run": "echo \"Step 2\"" }
    ]
  }
  ```

## 단계 타입

`steps` 배열의 각 단계는 다음 타입 중 하나일 수 있습니다:

1. **`run`** - 셸 명령 실행
2. **`choose`** - 사용자 선택 메뉴
3. **`prompt`** - 사용자 텍스트 입력
4. **`parallel`** - 병렬 실행
5. **`fail`** - 워크플로우 실패

각 단계 타입에 대한 자세한 설명은 [단계 타입](/docs/dsl-reference/step-types) 문서를 참조하세요.

## 조건부 실행

모든 단계는 `when` 절을 사용하여 조건부로 실행할 수 있습니다:

```yaml
steps:
  - when:
      file: ./package.json
    run: 'npm install'
```

조건에 대한 자세한 설명은 [조건](/docs/dsl-reference/conditions) 문서를 참조하세요.

## 에러 처리 (`run` 실패와 `onError`)

기본적으로 `run` 단계가 모든 재시도 후에도 실패(0이 아닌 종료 코드)하면, 워크플로우는 해당 단계에서 중지되고 실패로 기록됩니다.

`run` 단계마다 `onError` 옵션을 사용해 이 동작을 변경할 수 있습니다:

```yaml
steps:
  - run: 'pnpm lint'
    retry: 2
    continue: true       # 성공/실패 무관하게 다음 단계로 계속 진행
    onError:
      run: 'pnpm lint:fix'   # lint 실패 시 실행할 fallback 명령 (사이드 이펙트만)
      retry: 1             # fallback 명령의 재시도 횟수
```

핵심 동작:

- `onError` 는 메인 `run` 명령(자신의 `retry` 포함)이 실패한 뒤에만 평가됩니다.
- `onError`는 단순히 사이드 이펙트(정리, 롤백, 로깅)만 수행하며, 스텝의 성공/실패 여부를 변경하지 않습니다.
- `onError` 안에 다시 `onError` 를 넣어 **재귀 체인**을 만들 수 있습니다:

  ```yaml
  - run: 'step1'
    onError:
      run: 'step2'
      onError:
        run: 'step3'
  ```

  스텝의 성공/실패는 항상 메인 `run` 명령의 결과로 결정되며, `onError` 명령의 결과와는 무관합니다.

- `continue` 플래그(`run` 스텝 레벨)는 이 스텝 완료 후 워크플로우 실행을 제어합니다:
  - `continue: true` - 항상 다음 스텝으로 진행 (성공/실패 무관)
  - `continue: false` - 항상 워크플로우 중단 (성공/실패 무관)
  - `continue` 미설정 (기본값) - 성공 시 진행, 실패 시 중단

자세한 문법과 예제는 [`run` 단계 타입 문서](/docs/dsl-reference/step-types#1-run---명령-실행) 를 참고하세요.

## 변수 치환

단계에서 변수를 사용할 수 있습니다:

```yaml
steps:
  - prompt:
      message: "버전을 입력하세요:"
      as: version
  - run: 'echo "Building {{version}}"'
```

변수에 대한 자세한 설명은 [변수](/docs/dsl-reference/variables) 문서를 참조하세요.

## 다음 단계

- **[단계 타입](/docs/dsl-reference/step-types)** - 사용 가능한 모든 단계 타입
- **[조건](/docs/dsl-reference/conditions)** - 조건부 실행 방법
- **[변수](/docs/dsl-reference/variables)** - 변수 사용법
- **[프로필](/docs/dsl-reference/profiles)** - 미리 설정된 변수로 비대화형 실행
- **[완전한 예제](/docs/dsl-reference/complete-example)** - 모든 기능을 포함한 예제
