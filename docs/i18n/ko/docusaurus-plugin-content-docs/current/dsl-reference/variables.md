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

변수는 `{{variableName}}` 문법을 사용하여 명령에서 사용할 수 있습니다.

### 문법

```yaml
run: echo "{{variableName}}"
```

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
