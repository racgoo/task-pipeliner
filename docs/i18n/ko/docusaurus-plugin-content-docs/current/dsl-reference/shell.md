# Shell 설정

워크플로우 **최상위** 또는 **단계별**로 `shell`을 지정하면 `run` 명령을 어떤 셸에서 실행할지 제어할 수 있습니다. 특정 셸(예: bash 로그인 셸) 사용, Windows에서 PowerShell 사용, 한 워크플로우에서 셸을 섞어 쓰는 경우 등에 유용합니다.

## `shell`을 지정하는 위치

- **워크플로우 레벨** (파일 최상위): 자체 `shell`을 정의하지 않는 모든 `run` 단계에 적용됩니다.
- **단계 레벨** (`run` 단계에서): 해당 단계에서만 워크플로우 `shell`을 덮어씁니다.

**우선순위:** 단계 `shell` > 워크플로우 `shell` > 기본값(사용자 현재 셸).

## 형식

`shell`은 문자열 배열입니다: **`[프로그램, ...인자]`**.

- **첫 번째 요소**: 셸 프로그램 (예: `bash`, `cmd.exe`, `powershell`).
- **나머지**: 해당 프로그램에 넘기는 인자. `run`에 적은 명령은 마지막 인자로 전달됩니다 (예: `-c`, `/c`, `-Command`).

**YAML:**

```yaml
name: My Workflow

# 전역: 모든 run 단계에 적용
shell: [bash, -lc]

steps:
  - run: 'echo "uses bash -lc"'
  - run: 'echo "uses PowerShell for this step only"'
    shell: [powershell, -Command]
```

**JSON:**

```json
{
  "name": "My Workflow",
  "shell": ["bash", "-lc"],
  "steps": [
    { "run": "echo \"uses bash -lc\"" },
    { "run": "echo \"PowerShell here\"", "shell": ["powershell", "-Command"] }
  ]
}
```

## 생략 시 기본값

`shell`을 지정하지 않으면:

- **Linux/macOS**: `$SHELL` 환경 변수를 사용합니다 (예: `/bin/zsh`, `/bin/bash`). `tp run`을 실행한 것과 같은 셸에서 명령이 실행됩니다.
- **Windows**: `SHELL`이 없으면 `cmd.exe`와 `/c`를 사용하고, 있으면 `SHELL`에 지정된 프로그램을 사용합니다. 터미널과 동일한 환경에서 `run` 명령이 실행됩니다.

## 플랫폼별 예시

### Linux / macOS

```yaml
# Bash (로그인 셸, .bash_profile 등 로드)
shell: [bash, -lc]

# Bash (비로그인)
shell: [bash, -c]

# Zsh
shell: [zsh, -c]

# POSIX sh
shell: [sh, -c]

# 절대 경로
shell: [/usr/bin/bash, -c]
```

### Windows

```yaml
# 명령 프롬프트 (cmd.exe)
shell: [cmd, /c]

# Windows PowerShell
shell: [powershell, -Command]

# PowerShell Core (pwsh)
shell: [pwsh, -Command]

# Windows용 Git Bash
shell: [bash, -c]
```

### 크로스 플랫폼 워크플로우

단계마다 다른 셸이 필요하면 단계별로 `shell`을 지정할 수 있습니다. Unix와 Windows 모두에서 도는 워크플로우에서는 단계마다 `bash` 또는 `cmd`/`powershell`을 명시하는 방식으로 쓸 수 있습니다.

## 단계별 덮어쓰기

`run` 단계에서 워크플로우 `shell`을 덮어쓸 수 있습니다:

```yaml
shell: [bash, -lc]

steps:
  - run: 'npm run build'           # bash -lc 사용
  - run: 'Write-Host "Done"'      # 이 단계만 PowerShell 사용
    shell: [powershell, -Command]
```

## 참고

| 레벨       | 필드   | 타입               | 설명 |
|------------|--------|--------------------|------|
| 워크플로우 | `shell` | `string` 배열 | 모든 `run` 단계에 적용되는 전역 셸. 형식: `[program, ...args]`. |
| 단계       | `shell` | `string` 배열 | 이 `run` 단계에만 적용. 워크플로우 `shell`을 덮어씀. |

## 참고 문서

- [워크플로우 구조](/docs/dsl-reference/workflow-structure) - `shell`을 포함한 최상위 필드
- [단계 타입 – run](/docs/dsl-reference/step-types#1-run---명령-실행) - `run` 단계 문법과 옵션
- **예제**: [YAML 예제](/docs/examples#yaml-examples)의 `shell-example.yaml`, `shell-windows-example.yaml` (동일한 JSON 예제는 `json-examples/`에 있음)
