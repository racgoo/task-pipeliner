# CLI 명령어 참조

task-pipeliner의 모든 CLI 명령어에 대한 완전한 참조입니다.

## 워크플로우 실행

### `tp run [file]`

YAML 또는 JSON 파일에서 워크플로우를 실행합니다.

```bash
tp run workflow.yaml        # 워크플로우 실행
tp run                      # 가장 가까운 tp 디렉토리에서 워크플로우 선택하여 실행
tp run workflow.yaml --profile Test   # 프로필로 실행 (프로필에 설정된 변수는 choose/prompt 생략)
tp run workflow.yaml -p Test         # 프로필 짧은 형식
tp run workflow.yaml --silent  # 사일런트 모드로 실행 (모든 콘솔 출력 억제)
tp run workflow.yaml -s     # 사일런트 모드 짧은 형식
```

**옵션:**
- `-p, --profile <name>` - 프로필로 실행 (비대화형 모드)
- `-s, --silent` - 사일런트 모드로 실행 (모든 콘솔 출력 억제)

**동작:**
- 파일이 지정되지 않으면 가장 가까운 `tp` 디렉토리를 찾아 대화형 메뉴를 표시합니다
- 프로필을 사용하면 변수를 미리 채워서 비대화형으로 실행할 수 있습니다
- 사일런트 모드는 모든 출력을 억제합니다 (CI/CD에 유용)

## 리소스 열기

### `tp open <target>`

브라우저에서 생성기나 문서 사이트를 엽니다.

```bash
tp open generator  # 시각적 워크플로우 생성기 열기
tp open docs       # 문서 사이트 열기
```

**대상:**
- `generator` - 시각적 워크플로우 생성기 열기 (https://task-pipeliner-generator.racgoo.com/)
- `docs` - 문서 사이트 열기 (https://task-pipeliner.racgoo.com/)

## 히스토리 관리

### `tp history`

워크플로우 실행 히스토리를 보고 관리합니다.

```bash
tp history         # 워크플로우 실행 히스토리 보기
tp history show    # 특정 히스토리 선택하여 보기
tp history remove   # 특정 히스토리 삭제
tp history remove-all # 모든 히스토리 삭제
```

**하위 명령어:**
- `show` - 상세한 실행 정보와 함께 특정 히스토리 파일 보기
- `remove` - 특정 히스토리 파일 삭제 (대화형 선택)
- `remove-all` - 모든 히스토리 파일 삭제 (확인 필요)

**저장 위치:** 히스토리 파일은 타임스탬프가 포함된 파일명으로 `~/.pipeliner/workflow-history/`에 저장됩니다.

## 워크플로우 스케줄링

### `tp schedule`

모든 스케줄 보기 (`tp schedule list`와 동일).

```bash
tp schedule        # 모든 스케줄 보기
```

### `tp schedule list`

데몬 상태와 함께 모든 스케줄 목록을 표시합니다.

```bash
tp schedule list
# 또는
tp schedule ls
```

상태 정보가 포함된 통일된 카드 레이아웃으로 모든 스케줄을 표시합니다.

### `tp schedule add [scheduleFile]`

스케줄 파일(YAML 또는 JSON)에서 스케줄을 추가합니다.

```bash
tp schedule add schedules.yaml
```

- 파일 경로가 제공되지 않으면 프롬프트를 표시합니다
- cron 표현식과 워크플로우 파일 존재 여부를 검증합니다
- 각 스케줄의 별칭을 변경할 수 있습니다

### `tp schedule remove`

특정 스케줄을 삭제합니다.

```bash
tp schedule remove
# 또는
tp schedule rm
```

삭제할 스케줄을 선택하는 대화형 메뉴를 표시합니다.

### `tp schedule remove-all`

모든 스케줄을 삭제합니다.

```bash
tp schedule remove-all
```

모든 스케줄을 삭제하기 전에 확인 프롬프트를 표시합니다.

### `tp schedule toggle`

스케줄을 활성화하거나 비활성화합니다.

```bash
tp schedule toggle
```

전환할 스케줄을 선택하는 대화형 메뉴를 표시합니다.

### `tp schedule start`

스케줄러를 시작합니다.

```bash
tp schedule start        # 포그라운드 모드로 시작
tp schedule start -d     # 데몬 모드로 시작 (백그라운드)
```

**옵션:**
- `-d, --daemon` - 백그라운드 데몬 모드로 실행

**모드:**
- **포그라운드 모드**: 터미널에 연결되어 실행되며, `Ctrl+C`를 눌러 중지할 수 있습니다
- **데몬 모드**: 백그라운드에서 실행되며, 터미널을 닫아도 계속 실행됩니다

### `tp schedule stop`

스케줄러 데몬을 종료합니다.

```bash
tp schedule stop
```

- 실행 중인 데몬 프로세스를 정상적으로 종료합니다
- PID 및 시작 시간 파일을 제거합니다

### `tp schedule status`

데몬 및 스케줄 상태를 확인합니다.

```bash
tp schedule status      # 실시간 보기 (1초마다 갱신); Ctrl+C는 화면만 종료, 데몬은 유지
tp schedule status -n   # 한 번만 표시 후 종료 (갱신 없음)
```

**옵션:**
- `-n, --no-follow` - 한 번만 표시하고 종료 (실시간 갱신 없음)

**표시 내용:**
- 데몬 상태(active/inactive), PID, 시작 시간, 업타임 표시
- 모든 스케줄을 상태, cron, 타임존, 워크플로우, 프로필, 마지막 실행, 다음 실행과 함께 나열
- 일관성을 위해 `tp schedule list`와 동일한 카드 레이아웃 사용

## 데이터 관리

### `tp clean`

`~/.pipeliner`의 모든 데이터를 삭제합니다 (스케줄, 데몬 상태, 워크플로우 히스토리).

```bash
tp clean
```

**삭제 대상:**
- 모든 스케줄 (`~/.pipeliner/schedules/`)
- 데몬 상태 (PID, 시작 시간) (`~/.pipeliner/daemon/`)
- 워크플로우 실행 히스토리 (`~/.pipeliner/workflow-history/`)

**동작:**
- 삭제하기 전에 확인 프롬프트를 표시합니다
- 스케줄러 데몬이 실행 중이면 먼저 종료합니다
- 그 다음 전체 `~/.pipeliner` 디렉토리를 삭제합니다

**언제 사용하나요:**
- 버전 업그레이드 후 호환 문제가 있을 때 (예: 스케줄 또는 데몬이 제대로 작동하지 않음)
- 로컬 데이터를 초기화하고 새로 시작하려고 할 때

## 빠른 참조

| 명령어 | 설명 |
|--------|------|
| `tp run [file]` | 워크플로우 실행 |
| `tp run --profile <name>` | 프로필로 실행 (비대화형) |
| `tp run --silent` | 사일런트 모드로 실행 |
| `tp open generator` | 시각적 생성기 열기 |
| `tp open docs` | 문서 열기 |
| `tp history` | 실행 히스토리 보기 |
| `tp schedule` | 모든 스케줄 보기 |
| `tp schedule add <file>` | 파일에서 스케줄 추가 |
| `tp schedule start -d` | 백그라운드에서 데몬 시작 |
| `tp schedule stop` | 데몬 종료 |
| `tp schedule status` | 데몬 상태 확인 |
| `tp clean` | 모든 로컬 데이터 삭제 |

## 저장 위치

모든 데이터는 `~/.pipeliner/` 아래에 저장됩니다:

- **스케줄**: `~/.pipeliner/schedules/schedules.json`
- **데몬 PID**: `~/.pipeliner/daemon/scheduler.pid`
- **데몬 시작 시간**: `~/.pipeliner/daemon/scheduler.started`
- **히스토리**: `~/.pipeliner/workflow-history/`

## 참고 자료

- **[시작하기](/docs/getting-started)** - 설치 및 첫 워크플로우
- **[워크플로우 스케줄링](/docs/schedule)** - 상세한 스케줄링 가이드
- **[실행 히스토리](/docs/history)** - 히스토리 관리 세부사항
- **[DSL 참조](/docs/dsl-reference/workflow-structure)** - 워크플로우 문법

