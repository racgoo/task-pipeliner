# task-pipeliner 소개

**task-pipeliner**는 YAML 또는 JSON 파일로 작업 파이프라인을 정의하고 실행하는 현대적인 워크플로우 자동화 도구입니다. 복잡한 빌드 스크립트나 CI/CD 설정 대신, 간단하고 읽기 쉬운 YAML 또는 JSON 문법으로 워크플로우를 작성할 수 있습니다.

## 왜 task-pipeliner인가?

### 기존 도구의 문제점

- **복잡한 스크립트**: Bash, Makefile 등은 유지보수가 어렵고 가독성이 떨어집니다
- **제한적인 조건 처리**: 복잡한 조건 로직을 표현하기 어렵습니다
- **단조로운 출력**: 실행 상태를 파악하기 어렵습니다
- **환경별 분기**: 환경별로 다른 스크립트를 관리해야 합니다

### task-pipeliner의 장점

- **선언적 문법**: YAML 또는 JSON으로 워크플로우를 명확하게 정의합니다
- **강력한 조건 처리**: 파일 존재, 변수 값, 사용자 입력에 따른 분기 처리
- **아름다운 출력**: 실시간으로 색상과 포맷팅이 적용된 터미널 출력
- **대화형 실행**: 실행 중 사용자에게 입력을 요청하고 선택을 받을 수 있습니다
- **프로필**: 미리 정의한 변수로 비대화형 실행(`tp run --profile <name>`); 프로필에 설정된 변수에 대해서는 choose/prompt 단계 생략
- **병렬 처리**: 여러 작업을 동시에 실행하여 시간을 절약합니다
- **실행 히스토리**: 과거 실행 내역을 추적하고 검토할 수 있습니다
- **워크플로우 스케줄링**: 스케줄 파일(YAML/JSON)로 cron에 따라 워크플로우 자동 실행

## 빠른 시작

### 설치

#### 전역 설치

전역으로 설치하면 `task-pipeliner` 또는 `tp` 명령을 직접 사용할 수 있습니다:

```bash
npm install -g task-pipeliner
# 또는
pnpm add -g task-pipeliner
```

전역 설치 후 다음 명령으로 실행할 수 있습니다:
```bash
task-pipeliner run workflow.yaml
# 또는 짧은 별칭 사용
tp run workflow.yaml
```

#### 프로젝트 설치 (개발 모드)

프로젝트에 devDependency로 설치하면 `npx`로 사용할 수 있습니다:

```bash
npm install -D task-pipeliner
# 또는
pnpm add -D task-pipeliner
```

프로젝트 설치 후 다음 명령으로 실행할 수 있습니다:
```bash
npx task-pipeliner run workflow.yaml
# 또는 짧은 별칭 사용
npx tp run workflow.yaml
```

### 첫 번째 워크플로우

`workflow.yaml` 또는 `workflow.json` 파일을 생성하세요:

**YAML 형식 (`workflow.yaml`):**

```yaml
name: My First Workflow

steps:
  - run: echo "Hello, World!"
  
  - choose:
      message: "무엇을 하시겠습니까?"
      options:
        - id: build
          label: "프로젝트 빌드"
        - id: test
          label: "테스트 실행"
      as: action
  
  - when:
      var:
        action: build
    run: npm run build
  
  - when:
      var:
        action: test
    run: npm test
```

**JSON 형식 (`workflow.json`):**

```json
{
  "name": "My First Workflow",
  "steps": [
    {
      "run": "echo \"Hello, World!\""
    },
    {
      "choose": {
        "message": "무엇을 하시겠습니까?",
        "options": [
          {
            "id": "build",
            "label": "프로젝트 빌드"
          },
          {
            "id": "test",
            "label": "테스트 실행"
          }
        ],
        "as": "action"
      }
    },
    {
      "when": {
        "var": {
          "action": "build"
        }
      },
      "run": "npm run build"
    },
    {
      "when": {
        "var": {
          "action": "test"
        }
      },
      "run": "npm test"
    }
  ]
}
```

실행:

```bash
task-pipeliner run workflow.yaml
# 또는
task-pipeliner run workflow.json
# 또는 짧은 별칭 사용
tp run workflow.yaml
tp run workflow.json

# 프로필로 실행 (프로필에 설정된 변수는 choose/prompt 생략)
tp run workflow.yaml --profile Test
# 또는 짧은 형식 사용
tp run workflow.yaml -p Test

# 사일런트 모드로 실행 (모든 콘솔 출력 억제)
tp run workflow.yaml --silent
# 또는 짧은 형식 사용
tp run workflow.yaml -s
```

## 핵심 개념

### 워크플로우 (Workflow)

워크플로우는 여러 단계(steps)로 구성된 작업 파이프라인입니다. 각 단계는 순차적으로 실행되며, 조건에 따라 실행 여부를 결정할 수 있습니다.

### 단계 (Steps)

- **`run`**: 셸 명령 실행
- **`choose`**: 사용자에게 선택 메뉴 표시
- **`prompt`**: 사용자에게 텍스트 입력 요청
- **`parallel`**: 여러 단계를 병렬로 실행
- **`fail`**: 워크플로우를 의도적으로 실패시킴

### 조건 (Conditions)

`when` 절을 사용하여 단계 실행 조건을 지정할 수 있습니다:

- **파일 존재**: `file: ./dist`
- **변수 값 비교**: `var: { env: 'prod' }`
- **변수 존재**: `var: 'version'` 또는 `has: 'version'`
- **선택 확인**: `choice: 'optionId'`
- **논리 연산**: `all`, `any`, `not`

### 변수 (Variables)

사용자 입력이나 선택한 값을 변수로 저장하고, 명령에서 `{{variable}}` 문법으로 사용할 수 있습니다.

### 프로필 (Profiles)

워크플로우에 이름 붙은 변수 세트를 정의하고 `tp run --profile <name>` 으로 실행할 수 있습니다. 해당 변수에 대한 choose·prompt 단계는 생략되므로, 같은 워크플로우를 CI 등에서 비대화형으로 실행할 수 있습니다.

### 실행 히스토리 (History)

모든 워크플로우 실행은 자동으로 기록되어 `~/.pipeliner/workflow-history/`에 저장됩니다. 과거 실행 내역을 검토하고 디버깅할 수 있습니다.

## 도구

- 🎨 **[시각적 생성기](https://task-pipeliner-generator.racgoo.com/)** - 브라우저에서 워크플로우를 시각적으로 생성하고 YAML/JSON으로 다운로드
- 💻 **CLI 명령어**: 
  - `tp open generator` - 생성기 열기
  - `tp open docs` - 문서 열기
  - `tp history` - 실행 히스토리 관리
  - `tp schedule add` - 스케줄 파일(YAML/JSON)에서 워크플로우 추가

## 다음 단계

- **[시작하기](/docs/getting-started)** - 설치부터 첫 워크플로우까지
- **[DSL 참조](/docs/dsl-reference/workflow-structure)** - 완전한 문법 가이드
- **[실행 히스토리](/docs/history)** - 과거 실행 내역 관리하기
- **[워크플로우 스케줄링](/docs/schedule)** - cron으로 워크플로우 예약
- **[예제](/docs/examples)** - 실제 사용 사례와 예제

## 커뮤니티

- **GitHub**: [프로젝트 저장소](https://github.com/racgoo/task-pipeliner)
- **이슈 리포트**: 버그나 기능 제안은 GitHub Issues를 이용해주세요
- **기여**: Pull Request를 환영합니다!

