# 프로필 (Profiles)

프로필을 사용하면 변수 값을 미리 정의해 워크플로우를 **비대화형**으로 실행할 수 있습니다. `tp run --profile <name>` 을 사용하면, 프로필에 이미 설정된 변수에 값을 저장하는 **choose** 또는 **prompt** 단계는 생략되고, 프로필 값이 `{{variable}}` 치환 및 조건에 사용됩니다.

## 프로필 정의하기

워크플로우 최상위(`name`, `baseDir`, `shell`, `steps` 와 같은 레벨)에 `profiles` 배열을 추가하세요.

**YAML:**

```yaml
name: My Workflow

profiles:
  - name: Test
    var:
      mode: "dev"
      label: "test-label"
  - name: Prod
    var:
      mode: "prod"
      label: "prod-label"

steps:
  - choose:
      message: "모드 선택"
      options:
        - id: dev
          label: Development
        - id: prod
          label: Production
      as: mode
  - prompt:
      message: "라벨 입력"
      as: label
      default: "default-label"
  - run: 'echo "{{ mode }} / {{ label }}"'
```

**JSON:**

```json
{
  "name": "My Workflow",
  "profiles": [
    { "name": "Test", "var": { "mode": "dev", "label": "test-label" } },
    { "name": "Prod", "var": { "mode": "prod", "label": "prod-label" } }
  ],
  "steps": [
    {
      "choose": {
        "message": "모드 선택",
        "options": [
          { "id": "dev", "label": "Development" },
          { "id": "prod", "label": "Production" }
        ],
        "as": "mode"
      }
    },
    {
      "prompt": {
        "message": "라벨 입력",
        "as": "label",
        "default": "default-label"
      }
    },
    {
      "run": "echo \"{{ mode }} / {{ label }}\""
    }
  ]
}
```

## 프로필로 실행하기

`--profile` 또는 `-p` 옵션에 프로필 이름을 지정하세요:

```bash
tp run workflow.yaml --profile Test
# 또는
tp run workflow.yaml -p Prod
```

- `--profile Test` 로 실행하면 **choose** 단계(`mode` 저장)와 **prompt** 단계(`label` 저장)가 생략되고, Test 프로필의 값(`mode: "dev"`, `label: "test-label"`)이 사용됩니다.
- 명령과 조건에서는 사용자가 선택하거나 입력한 것과 동일한 값으로 동작합니다.

## 프로필 필드 참조

| 필드   | 타입     | 필수 | 설명                                                  |
|--------|----------|------|-------------------------------------------------------|
| `name` | `string` | 예   | 프로필 이름(비어 있지 않아야 하며, 고유해야 함).       |
| `var`  | object   | 예   | 키-값 맵; 키는 변수 이름, 값은 문자열(YAML/JSON의 숫자·불리언은 문자열로 변환됨). |

## 동작 상세

- **choose 단계**: 해당 단계에 `as` 필드가 있고, 그 변수가 프로필에 설정되어 있으며, **그리고** 프로필 값이 옵션 `id` 중 하나와 일치할 때만 생략됩니다. 그렇지 않으면 선택 프롬프트가 표시됩니다.
- **prompt 단계**: `as` 에 지정된 변수가 이미 프로필에 설정되어 있으면 생략됩니다. 그렇지 않으면 텍스트 프롬프트가 표시됩니다.
- **변수 치환**: run 명령의 모든 `{{variable}}` 은 프로필에 변수가 설정된 경우 프로필 값을 사용합니다.
- **조건**: `when` 절(예: `var: { mode: "prod" }`)은 프로필 값을 사용하므로, 선택한 프로필에 따라 단계가 생략되거나 실행됩니다.

## 예: CI에서 사용하기

CI나 스크립트에서 프로필을 사용하면 사용자 입력 없이 실행할 수 있습니다:

```yaml
profiles:
  - name: ci
    var:
      env: prod
      version: "1.0.0"

steps:
  - choose:
      message: "환경 선택"
      options:
        - id: dev
          label: Development
        - id: prod
          label: Production
      as: env
  - run: 'echo "Deploying {{env}} at {{version}}"'
```

```bash
tp run workflow.yaml --profile ci
```

프롬프트 없이 `env=prod`, `version=1.0.0` 으로 워크플로우가 실행됩니다.

## CLI 변수 주입 (`-v` / `--var`)

`-v key=value` 또는 `--var key=value` 로 명령줄에서 변수를 주입할 수 있습니다. 프로필과 `-v` 로 같은 변수를 모두 설정한 경우 **주입한 값이 우선**합니다 (CLI가 프로필을 덮어씀).

```bash
# 프로필만: 프로필 값 사용
tp run workflow.yaml --profile Test

# 프로필에서 특정 변수만 덮어쓰기
tp run workflow.yaml --profile Test -v mode=staging -v label=from-cli
```

두 번째 예에서는 `mode`와 `label`은 CLI에서 오고, 나머지 변수(예: `env`)는 프로필 값을 그대로 씁니다. 자세한 내용은 [CLI 참조 – tp run](/docs/cli-reference#tp-run-file)과 [예제](/docs/examples#yaml-examples)의 **var-injection-example**을 참조하세요.

## 다음 단계

- [워크플로우 구조](/docs/dsl-reference/workflow-structure) - `profiles` 를 포함한 최상위 필드
- [변수](/docs/dsl-reference/variables) - 변수 치환 및 YAML 문법
- [단계 타입](/docs/dsl-reference/step-types) - `choose` 와 `prompt` 단계
