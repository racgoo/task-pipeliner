# 조건

조건부 실행을 위한 `when` 절 사용법을 설명합니다.

## 개요

조건은 단계가 실행되는 시점을 제어합니다. 모든 조건은 워크스페이스 상태에 대한 질문으로 평가됩니다.

## 조건 타입

### 1. 파일 존재 (`file`)

파일 또는 디렉토리가 존재하는지 확인합니다.

#### 문법

```yaml
when:
  file: <path>
```

```json
{
  "when": {
    "file": "<path>"
  }
}
```

#### 속성

- `file`: `string` - 파일 또는 디렉토리 경로 (현재 작업 디렉토리 기준)

#### 예제

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

#### 동작

- 경로는 `process.cwd()` (현재 작업 디렉토리) 기준으로 해석됩니다
- 파일 또는 디렉토리가 존재하면 `true`, 그렇지 않으면 `false`를 반환합니다

---

### 2. 변수 값 비교 (`var` 객체)

변수가 특정 값과 같은지 확인합니다.

#### 문법

```yaml
when:
  var:
    <variable-name>: <expected-value>
```

```json
{
  "when": {
    "var": {
      "<variable-name>": "<expected-value>"
    }
  }
}
```

#### 속성

- `var`: `object` - 변수 이름을 키로, 예상 값을 값으로 가진 객체
- 키: 변수 이름 (`prompt.as` 또는 `choose.as`에서)
- 값: 비교할 예상 문자열 값

#### 예제

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

#### 동작

- 변수 값(문자열)을 예상 값과 비교합니다
- 값이 정확히 일치하면 `true`를 반환합니다 (대소문자 구분)
- 변수가 존재하지 않거나 값이 일치하지 않으면 `false`를 반환합니다
- 객체의 모든 키-값 쌍이 일치해야 합니다 (AND 논리)

---

### 3. 변수 존재 (`var` 문자열 또는 `has`)

변수가 존재하는지 확인합니다 (값과 무관하게).

#### 문법

```yaml
when:
  var: <variable-name>
# 또는
when:
  has: <variable-name>  # var의 별칭
```

```json
{
  "when": {
    "var": "<variable-name>"
  }
}
// 또는
{
  "when": {
    "has": "<variable-name>"
  }
}
```

#### 속성

- `var` 또는 `has`: `string` - 확인할 변수 이름

#### 예제

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

#### 동작

- 변수가 존재하면 `true`를 반환합니다 (`prompt.as` 또는 `choose.as`에서)
- 변수가 존재하지 않으면 `false`를 반환합니다
- 값을 확인하지 않고 존재 여부만 확인합니다

---

### 4. 선택 확인 (`choice`)

사용자가 특정 선택을 했는지 확인합니다.

#### 문법

```yaml
when:
  choice: <choice-id>
```

```json
{
  "when": {
    "choice": "<choice-id>"
  }
}
```

#### 속성

- `choice`: `string` - 확인할 선택 ID (`choose` 단계의 옵션 `id`)

#### 예제

```yaml
- choose:
    message: "환경을 선택하세요:"
    options:
      - id: dev
        label: "개발"
      - id: prod
        label: "프로덕션"

# 선택 확인
- when:
    choice: dev
  run: echo "개발 환경 작업 중"
```

#### 동작

- 사용자가 해당 ID를 선택했으면 `true`를 반환합니다
- 선택하지 않았거나 선택이 존재하지 않으면 `false`를 반환합니다
- **참고**: `var` 조건을 사용하는 것이 권장됩니다 (더 유연함)

---

### 5. 결합된 조건

`all`, `any`, `not`을 사용하여 여러 조건을 결합합니다.

#### `all` - AND 논리

모든 조건이 참이어야 합니다.

##### 문법

```yaml
when:
  all:
    - <condition1>
    - <condition2>
    - <condition3>
```

```json
{
  "when": {
    "all": [
      { /* condition1 */ },
      { /* condition2 */ },
      { /* condition3 */ }
    ]
  }
}
```

##### 예제

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

##### 동작

- 배열의 모든 조건이 `true`일 때만 `true`를 반환합니다
- 어떤 조건이라도 `false`이면 `false`를 반환합니다
- 단락 평가: 첫 번째 `false` 후 확인을 중지합니다

---

#### `any` - OR 논리

어떤 조건이라도 참일 수 있습니다.

##### 문법

```yaml
when:
  any:
    - <condition1>
    - <condition2>
    - <condition3>
```

```json
{
  "when": {
    "any": [
      { /* condition1 */ },
      { /* condition2 */ },
      { /* condition3 */ }
    ]
  }
}
```

##### 예제

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

##### 동작

- 배열의 어떤 조건이라도 `true`이면 `true`를 반환합니다
- 모든 조건이 `false`일 때만 `false`를 반환합니다
- 단락 평가: 첫 번째 `true` 후 확인을 중지합니다

---

#### `not` - 부정

조건을 부정합니다.

##### 문법

```yaml
when:
  not:
    <condition>
```

```json
{
  "when": {
    "not": { /* condition */ }
  }
}
```

##### 예제

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

##### 동작

- 내부 조건이 `false`이면 `true`를 반환합니다
- 내부 조건이 `true`이면 `false`를 반환합니다
- 모든 조건 타입을 부정할 수 있습니다

---

### 6. 중첩된 조건

조건을 중첩하여 복잡한 논리를 만들 수 있습니다.

#### 예제

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

## 다음 단계

- **[변수](/docs/dsl-reference/variables)** - 변수 사용법
- **[완전한 예제](/docs/dsl-reference/complete-example)** - 모든 기능을 포함한 예제
