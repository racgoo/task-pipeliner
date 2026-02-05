# 워크플로우 스케줄링

cron 표현식을 사용해 지정된 시간에 워크플로우를 자동으로 실행할 수 있습니다. YAML 또는 JSON 스케줄 파일을 만들고 `tp schedule add`로 등록하세요.

## 개요

- **스케줄 파일**: 하나의 YAML/JSON 파일에 여러 스케줄 정의
- **경로 해석**: 워크플로우 경로는 스케줄 파일 디렉토리(또는 `baseDir`) 기준 상대 경로
- **옵션**: 스케줄별 `silent` 모드, `profile` 지원
- **Cron**: 5자리(분 단위) 또는 6자리(초 단위) 표현식

## 스케줄 파일 형식

### YAML 예시

```yaml
schedules:
  - name: Daily Build
    cron: "0 9 * * *"
    workflow: ./build.yaml

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true

  - name: Production Deploy
    cron: "0 18 * * 5"
    workflow: ./deploy.yaml
    profile: Production

  - name: Hourly Check
    cron: "0 * * * *"
    workflow: simple.yaml
    baseDir: /path/to/workflows
```

### JSON 예시

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

## 필드 참조

| 필드       | 타입      | 필수 | 설명                                                                 |
| ---------- | --------- | ---- | -------------------------------------------------------------------- |
| `name`     | `string`  | 예   | 스케줄 별칭 (구분용)                                                 |
| `cron`     | `string`  | 예   | Cron 표현식 (5자리 또는 6자리)                                      |
| `workflow` | `string`  | 예   | 워크플로우 파일 경로 (스케줄 파일 또는 baseDir 기준, 또는 절대 경로) |
| `baseDir`  | `string`  | 아니오 | 워크플로우 경로 기준 디렉토리 (기본: 스케줄 파일 디렉토리)         |
| `timezone` | `string` 또는 숫자 | 아니오 | UTC 오프셋(시간). 예: `+9`, `-5`, `0`. 생략 시 시스템 로컬 |
| `silent`   | `boolean` | 아니오 | 무음 모드로 실행 (콘솔 출력 억제)                                   |
| `profile`  | `string`  | 아니오 | 사용할 프로필 이름 (프로필이 있는 워크플로우용)                     |

## 타임존

**cron 표현식은 지정한 타임존 기준으로 해석됩니다.** 그 타임존에서 원하는 시각(시/분)을 그대로 넣으면 됩니다.

- **한국(UTC+9) 기준 매일 11시 33분에 실행하려면:**
  ```yaml
  cron: '33 11 * * *'
  timezone: '9'
  ```
- **UTC+8 기준 12시 33분:** `timezone: '8'`, `cron: '33 12 * * *'` (한국 시간으로는 13:33).
- `timezone`을 생략하면 서버의 로컬 시간을 사용합니다.

## 경로 해석

- **상대 경로**는 **스케줄 파일이 있는 디렉토리**를 기준으로 해석됩니다. 스케줄 파일과 워크플로우가 같은 폴더에 있으면 `./workflow.yaml`만 쓰면 됩니다.
- 다른 기준 디렉토리를 쓰려면 **`baseDir`**을 지정하세요.
- **절대 경로**는 그대로 사용됩니다.

이렇게 하면 `tp schedule add`를 어디서 실행하든 올바르게 동작합니다.

## Cron 표현식 형식

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
- `0 9 * * 1-5` - 평일 오전 9시

**초 포함 (6자리):**

- `* * * * * *` - 매초
- `*/5 * * * * *` - 5초마다
- `0 * * * * *` - 매분 (5자리 `* * * * *`와 동일)

## 스케줄 추가

```bash
tp schedule add schedules.yaml
```

파일 경로를 생략하면 입력 프롬프트가 뜹니다. 추가 시 각 스케줄의 별칭을 확인하거나 바꿀 수 있습니다.

## 스케줄 관리

### 스케줄 목록 보기

```bash
tp schedule list
# 또는
tp schedule ls
```

- **통일된 카드 레이아웃**으로 모든 스케줄을 표시합니다 (각 카드: 이름, active/inactive 배지, Enabled, Cron+사람이 읽기 쉬운 설명, Timezone, Workflow 경로, Profile, Last run, Next run).
- `tp schedule status`, `tp schedule start`에서도 같은 카드 레이아웃을 사용해 UI가 일관됩니다.

### 스케줄 삭제

```bash
tp schedule remove
# 또는
tp schedule rm
```

메뉴에서 삭제할 스케줄을 선택합니다.

### 모든 스케줄 삭제

```bash
tp schedule remove-all
```

삭제 전 확인 메시지가 표시됩니다.

### 스케줄 활성화/비활성화

```bash
tp schedule toggle
```

메뉴에서 스케줄을 선택해 활성/비활성을 전환합니다.

## 스케줄러 실행

예약된 시간에 워크플로우를 실행하려면 스케줄러를 시작하세요. 두 가지 모드로 실행할 수 있습니다:

### 포그라운드 모드

```bash
tp schedule start
```

- 포그라운드에서 실행됩니다 (터미널에 연결됨)
- `Ctrl+C`를 눌러 스케줄러를 중지합니다
- 테스트나 임시 스케줄링에 유용합니다

### 데몬 모드 (백그라운드)

```bash
tp schedule start -d
```

- 백그라운드 데몬 프로세스로 실행됩니다
- 터미널을 닫아도 계속 실행됩니다
- 한 번에 하나의 데몬 인스턴스만 실행 가능합니다 (중복 실행 방지)
- `tp schedule stop`으로 데몬을 종료합니다

### 데몬 상태 확인

```bash
tp schedule status      # 실시간 보기 (1초마다 갱신); Ctrl+C는 화면만 종료, 데몬은 유지
tp schedule status -n   # 한 번만 표시 후 종료 (갱신 없음)
```

- `tp schedule list`, `tp schedule start`와 **동일한 카드 레이아웃**으로 표시: 데몬 상태(active/inactive), PID, 시작 시각·업타임, 각 스케줄의 Enabled, Cron(사람이 읽기 쉬운 설명), Timezone, Workflow, Profile, Last run, Next run.
- `Ctrl+C`는 상태 화면만 종료하며, 데몬은 `tp schedule start -d`로 띄웠다면 계속 실행됩니다.

### 데몬 종료

```bash
tp schedule stop
```

- 실행 중인 데몬 프로세스를 정상적으로 종료합니다
- PID 및 시작 시간 파일을 제거합니다

스케줄러는 다음을 수행합니다:

- 예약된 시간에 워크플로우 실행
- 스케줄별 `silent`, `profile` 옵션 적용
- 실행 내역을 `~/.pipeliner/workflow-history/`에 기록 (silent가 아닐 때)
- 실시간 실행 상태 표시 (해당 스케줄에 `silent: true`가 아닐 때)
- 중복 데몬 인스턴스 실행을 방지합니다 (한 번에 하나만 실행 가능)

## 저장 위치

- **스케줄**: `~/.pipeliner/schedules/schedules.json`에 저장
- **데몬 PID**: `~/.pipeliner/daemon/scheduler.pid`에 저장
- **데몬 시작 시간**: `~/.pipeliner/daemon/scheduler.started`에 저장

## 데이터 초기화 (`tp clean`)

스케줄·데몬 데이터는 모두 `~/.pipeliner` 아래에 있습니다. 전부 삭제하려면:

```bash
tp clean
```

- 삭제 전 확인 메시지가 표시됩니다.
- 스케줄러 데몬이 실행 중이면 먼저 종료한 뒤 디렉터리를 삭제합니다.
- 삭제 대상: 스케줄, 데몬 상태(PID, 시작 시각), 워크플로우 실행 히스토리.

**언제 쓰나요:** 버전 업그레이드 후 호환이 맞지 않을 때(스케줄/데몬 오류 등) `tp clean`으로 로컬 데이터를 초기화한 뒤 다시 사용하면 됩니다.

> 💡 **참고:** 모든 명령어에 대한 완전한 문서는 [CLI 명령어 참조](/docs/cli-reference)를 확인하세요.

## 다음 단계

- **[DSL 참조](/docs/dsl-reference/workflow-structure)** - 워크플로우 문법
- **[프로필](/docs/dsl-reference/profiles)** - 스케줄 워크플로우에서 프로필 사용
- **[히스토리](/docs/history)** - 실행 히스토리
