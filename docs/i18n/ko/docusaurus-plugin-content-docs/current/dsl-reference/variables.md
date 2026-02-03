# 변수

변수 사용법과 치환 방법을 설명합니다.

## 개요

변수를 사용하면 사용자 입력이나 선택한 값을 저장하고, 워크플로우 전반에서 재사용할 수 있습니다.

## 변수 생성

변수는 다음 단계에서 생성됩니다:

### `prompt` 단계

```yaml
- prompt:
    message: "버전 번호를 입력하세요:"
    as: version
```

`as` 필드에 지정한 이름으로 변수가 생성됩니다.

### `choose` 단계

```yaml
- choose:
    message: "환경을 선택하세요:"
    options:
      - id: dev
        label: "개발"
      - id: prod
        label: "프로덕션"
    as: env
```

`as` 필드가 제공되면 해당 이름으로 변수가 생성됩니다. 생략하면 선택한 옵션의 `id`가 변수 이름으로 사용됩니다.

## 변수 치환

변수는 `{{variableName}}` 문법을 사용하여 명령에서 사용할 수 있습니다. 선택적으로 공백을 사용할 수 있습니다: `{{var}}`, `{{ var }}`, `{{  var  }}` 모두 작동합니다.

### 문법

```yaml
run: echo "{{variableName}}"
# 또는 선택적으로 공백 사용
run: echo "{{ variableName }}"
```

### ⚠️ 중요: YAML 문법 규칙

명령어에서 `{{variable}}`을 사용할 때, YAML 파싱 오류를 방지하기 위해 다음 규칙을 따르세요:

#### ✅ 안전한 패턴
```yaml
# 단어로 시작 (따옴표 불필요)
- run: echo "Building {{version}}..."
- run: npm run build --version={{version}}

# 전체 명령어를 작은따옴표로 감싸기
- run: 'echo "Selected: {{mode}}"'
- run: 'echo "{{project}} v{{version}}"'
```

#### ❌ 문제가 되는 패턴
```yaml
# 따옴표로 시작한 후 변수 앞에 콜론 사용 금지
- run: echo "mode: {{mode}}"        # ❌ YAML 파싱 에러!

# 해결: 전체 명령어를 작은따옴표로 감싸기
- run: 'echo "mode: {{mode}}"'      # ✅ 정상 작동
```

**이유:** YAML은 `key: value`를 매핑(mapping)으로 해석합니다. `run: echo "mode: {{mode}}"`를 작성하면, 파서가 `mode:`를 키로 인식하여 "Nested mappings" 에러가 발생합니다.

**간단한 규칙:** 명령어에 따옴표와 콜론이 `{{variable}}` 앞에 함께 있으면, 전체 명령어를 작은따옴표(`'...'`)로 감싸세요.

### 예제

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

### JSON 예제

```json
{
  "steps": [
    {
      "prompt": {
        "message": "프로젝트 이름을 입력하세요:",
        "as": "projectName"
      }
    },
    {
      "run": "echo \"Building {{projectName}}...\""
    }
  ]
}
```

## 변수 동작

- 변수는 문자열 값으로 대체됩니다
- 변수가 존재하지 않으면 빈 문자열로 대체됩니다
- 변수는 실행 시점에 해석됩니다
- 변수 이름은 대소문자를 구분합니다

## 변수 사용 예제

### 기본 사용

```yaml
name: Variable Example

steps:
  - prompt:
      message: "버전 번호를 입력하세요:"
      as: version
      default: "1.0.0"
  
  - run: echo "Building version {{version}}"
  
  - run: npm version {{version}}
```

### 조건부 변수 사용

```yaml
name: Conditional Variable

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
    prompt:
      message: "프로덕션 배포 사유를 입력하세요:"
      as: deployReason
  
  - run: echo "Deploying to {{env}}"
  
  - when:
      var: deployReason
    run: echo "Deployment reason: {{deployReason}}"
```

### 여러 변수 조합

```yaml
name: Multiple Variables

steps:
  - prompt:
      message: "프로젝트 이름을 입력하세요:"
      as: projectName
  
  - prompt:
      message: "버전 번호를 입력하세요:"
      as: version
  
  - choose:
      message: "환경을 선택하세요:"
      options:
        - id: dev
          label: "개발"
        - id: prod
          label: "프로덕션"
      as: env
  
  - run: echo "Building {{projectName}} version {{version}} for {{env}}"
  
  - run: npm run build -- --project={{projectName}} --version={{version}} --env={{env}}
```

## 변수와 조건

변수는 조건에서도 사용할 수 있습니다:

```yaml
- prompt:
    message: "버전 번호를 입력하세요:"
    as: version

# 변수 존재 확인
- when:
    var: version
  run: echo "Version: {{version}}"

# 변수 값 비교
- when:
    var:
      version: "1.0.0"
  run: echo "안정 버전 배포 중"
```

## 다음 단계

- **[완전한 예제](/docs/dsl-reference/complete-example)** - 모든 기능을 포함한 예제
