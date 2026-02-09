# 표준 출력 캡처 (captures)

`captures` 옵션은 **`run`** 스텝과 함께 사용하여 명령의 표준 출력에서 값을 추출하고 변수로 저장합니다. 이후 스텝에서 `{{변수이름}}`이나 조건에서 해당 변수를 사용할 수 있습니다.

## 개요

- **사용 위치**: `run` 스텝에서만 선택적 `captures` 배열로 지정합니다.
- **입력**: 명령의 표준 출력(일부 전략에서는 줄 단위로 합쳐진 문자열).
- **결과**: 각 캡처는 전략과 `as` 변수 이름을 가집니다. 성공 시 추출된 문자열이 저장되고, 실패(매칭 없음 또는 파싱 오류) 시 해당 변수는 설정되지 않으며 워크플로우는 계속 진행됩니다.
- **여러 캡처**: 한 스텝에 여러 캡처를 나열할 수 있으며, 순서대로 적용됩니다. 성공적으로 설정된 변수는 이후 스텝에서 사용할 수 있습니다.

## 캡처 시 표준 출력 처리

`run` 스텝에 `captures`가 하나라도 있으면 표준 출력이 **버퍼링**되어(줄 단위 스트리밍이 아닌) 명령 종료 후 파싱됩니다. 버퍼된 출력은 일반 실행과 동일한 박스 스타일로 표시됩니다.

## 캡처 전략

### 전체 캡처 (Full capture)

표준 출력 전체를 하나의 문자열로 저장합니다(필터링 없음).

| 필드 | 필수 | 설명 |
|------|------|------|
| `as` | 예   | 전체 stdout을 저장할 변수 이름 |

```yaml
- run: 'cat config.txt'
  captures:
    - as: config_content
```

### 정규식 캡처 (Regex capture)

전체 stdout 문자열에 대해 정규식을 적용하고 **첫 번째 캡처 그룹**의 값을 추출합니다. 정규식에는 최소 하나의 캡처 그룹 `(...)`이 있어야 하며, 첫 번째 그룹의 값이 저장됩니다.

| 필드   | 필수 | 설명 |
|--------|------|------|
| `regex` | 예  | JavaScript 스타일 정규식, 첫 번째 캡처 그룹 사용 |
| `as`    | 예  | 추출된 값을 저장할 변수 이름 |

```yaml
- run: 'echo "channel=production user=admin"'
  captures:
    - regex: "channel=(\\S+)"
      as: channel
    - regex: "user=(\\S+)"
      as: user
```

### JSON 캡처 (JSON capture)

표준 출력을 JSON으로 파싱한 뒤 **JSONPath** 식으로 값을 추출합니다. 경로가 여러 값을 반환하면 첫 번째만 사용됩니다. 문자열이 아닌 값은 JSON 문자열로 변환됩니다.

| 필드  | 필수 | 설명 |
|-------|------|------|
| `json` | 예  | JSONPath 식 (예: `$.version`, `$.meta.channel`) |
| `as`   | 예  | 추출된 값을 저장할 변수 이름 |

```yaml
- run: 'echo "{\"meta\":{\"version\":\"1.0.0\"}}"'
  captures:
    - json: "$.meta.version"
      as: version
```

### YAML 캡처 (YAML capture)

표준 출력을 YAML로 파싱한 뒤 **JSONPath** 식으로 값을 추출합니다(JSON과 동일). `yaml`과 `yml` 키 모두 사용할 수 있습니다.

| 필드        | 필수 | 설명 |
|-------------|------|------|
| `yaml` 또는 `yml` | 예 | 파싱된 YAML에 적용할 JSONPath 식 |
| `as`        | 예  | 추출된 값을 저장할 변수 이름 |

```yaml
- run: |
    echo "meta:"
    echo "  version: 1.0.0"
  captures:
    - yaml: "$.meta.version"
      as: version
```

### KV(키-값) 캡처 (KV capture)

`.env` 스타일 줄(`KEY=value` 또는 `KEY = value`)에서 지정한 키의 값을 추출합니다. 빈 줄과 주석은 건너뜁니다. 키는 정확히 일치해야 하며(접두어 매칭 아님), 값은 따옴표로 감쌀 수 있고 따옴표는 제거됩니다.

| 필드 | 필수 | 설명 |
|------|------|------|
| `kv` | 예   | 키 이름(예: `DATABASE_URL`) |
| `as` | 예   | 값을 저장할 변수 이름 |

```yaml
- run: 'cat .env'
  captures:
    - kv: DATABASE_URL
      as: db_url
    - kv: API_KEY
      as: api_key
```

### After / Before / Between 캡처

마커 **이후**, **이전**, 또는 두 마커 **사이**의 텍스트를 추출합니다. 전체 stdout 문자열을 대상으로 검색하며, 추출된 텍스트는 trim됩니다.

| 필드    | 필수 | 설명 |
|---------|------|------|
| `after`  | "after" 또는 "between"일 때 | 이 문자열 이후부터 추출 |
| `before` | "before" 또는 "between"일 때 | 이 문자열 이전까지 추출("after"만 쓰면 출력 끝까지) |
| `as`     | 예   | 추출된 텍스트를 저장할 변수 이름 |

```yaml
# after 마커
- run: 'echo "prefix value suffix"'
  captures:
    - after: "prefix "
      as: after_value

# before 마커
- run: 'echo "content before end"'
  captures:
    - before: " end"
      as: before_value

# between (두 마커 사이)
- run: 'echo "start:middle content:end"'
  captures:
    - after: "start:"
      before: ":end"
      as: between_value
```

### Line 캡처 (Line capture)

표준 출력에서 지정한 **줄 범위**를 추출합니다. 줄 번호는 **1부터** 시작하며 **끝 줄 포함**입니다(예: `from: 2, to: 4`는 2, 3, 4줄). 줄들은 개행 문자로 이어 붙입니다.

| 필드       | 필수 | 설명 |
|------------|------|------|
| `line.from` | 예  | 첫 줄 (1부터) |
| `line.to`   | 예  | 마지막 줄 (1부터, 포함) |
| `as`        | 예  | 추출된 블록을 저장할 변수 이름 |

```yaml
- run: |
    echo "line 1"
    echo "line 2"
    echo "line 3"
    echo "line 4"
  captures:
    - line:
        from: 2
        to: 3
      as: line_block
```

## 동작 요약

- **성공**: 추출된 문자열이 `as`에 지정한 변수 이름으로 저장됩니다. 이후 스텝에서 `{{변수이름}}`으로 사용할 수 있습니다.
- **실패**: 캡처가 매칭되지 않거나 파싱에 실패하면 해당 변수는 **설정되지 않습니다**. 같은 스텝의 다른 캡처는 그대로 적용되며, 워크플로우는 실패하지 않습니다.
- **여러 캡처**: `captures`의 각 항목은 독립적입니다. 한 스텝에서 전략을 섞어 쓸 수 있습니다(예: 정규식 하나, JSON 경로 하나).

## 참고

- **[단계 타입 – run](/docs/dsl-reference/step-types#1-run---명령-실행)** – `captures`를 포함한 `run` 전체 문법
- **[변수](/docs/dsl-reference/variables)** – 변수 치환 및 변수 생성 방법(prompt, choose, captures)
