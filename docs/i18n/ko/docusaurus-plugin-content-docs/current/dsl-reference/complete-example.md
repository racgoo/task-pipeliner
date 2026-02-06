# 완전한 예제

모든 기능을 포함한 완전한 워크플로우 예제입니다.

## 예제 워크플로우

이 예제는 task-pipeliner의 모든 주요 기능을 보여줍니다:

```yaml
name: Complete Workflow Example
baseDir: ./

steps:
  # 1. 간단한 명령
  - run: 'echo "워크플로우 시작 중..."'

  # 2. 변수 저장이 있는 사용자 선택
  - choose:
      message: "배포 환경을 선택하세요:"
      options:
        - id: dev
          label: "개발"
        - id: staging
          label: "스테이징"
        - id: prod
          label: "프로덕션"
      as: env

  # 3. 변수 값 기반 조건부 단계
  - when:
      var:
        env: prod
    prompt:
      message: "프로덕션 배포 사유를 입력하세요:"
      as: deployReason

  # 4. 변수 값 비교
  - when:
      var:
        env: dev
    run: 'echo "개발 환경에 배포 중..."'

  - when:
      var:
        env: staging
    run: 'echo "스테이징에 배포 중..."'

  # 5. 복잡한 조건 (all)
  - when:
      all:
        - var:
            env: prod
        - var: deployReason
        - file: ./dist
    run: 'echo "프로덕션 배포 승인됨"'

  # 6. 병렬 실행
  - parallel:
      - run: 'npm run test:unit'
      - run: 'npm run test:integration'
      - run: 'npm run lint'

  # 7. 파일 존재 확인
  - when:
      file: ./test-results
    run: 'echo "테스트 완료"'

  # 8. 결합된 조건 (any)
  - when:
      any:
        - var:
            env: staging
        - var:
            env: prod
    run: 'echo "서버에 배포 중..."'

  # 9. 부정
  - when:
      not:
        file: ./dist
    fail:
      message: "빌드 출력을 찾을 수 없습니다"

  # 10. 변수 치환
  - run: 'echo "Deploying {{projectName}} version {{version}} to {{env}}"'
```

## JSON 형식

동일한 워크플로우를 JSON 형식으로 표현하면:

```json
{
  "name": "Complete Workflow Example",
  "baseDir": "./",
  "steps": [
    {
      "run": "echo \"워크플로우 시작 중...\""
    },
    {
      "choose": {
        "message": "배포 환경을 선택하세요:",
        "options": [
          {
            "id": "dev",
            "label": "개발"
          },
          {
            "id": "staging",
            "label": "스테이징"
          },
          {
            "id": "prod",
            "label": "프로덕션"
          }
        ],
        "as": "env"
      }
    },
    {
      "when": {
        "var": {
          "env": "prod"
        }
      },
      "prompt": {
        "message": "프로덕션 배포 사유를 입력하세요:",
        "as": "deployReason"
      }
    },
    {
      "when": {
        "var": {
          "env": "dev"
        }
      },
      "run": "echo \"개발 환경에 배포 중...\""
    },
    {
      "when": {
        "var": {
          "env": "staging"
        }
      },
      "run": "echo \"스테이징에 배포 중...\""
    },
    {
      "when": {
        "all": [
          {
            "var": {
              "env": "prod"
            }
          },
          {
            "var": "deployReason"
          },
          {
            "file": "./dist"
          }
        ]
      },
      "run": "echo \"프로덕션 배포 승인됨\""
    },
    {
      "parallel": [
        {
          "run": "npm run test:unit"
        },
        {
          "run": "npm run test:integration"
        },
        {
          "run": "npm run lint"
        }
      ]
    },
    {
      "when": {
        "file": "./test-results"
      },
      "run": "echo \"테스트 완료\""
    },
    {
      "when": {
        "any": [
          {
            "var": {
              "env": "staging"
            }
          },
          {
            "var": {
              "env": "prod"
            }
          }
        ]
      },
      "run": "echo \"서버에 배포 중...\""
    },
    {
      "when": {
        "not": {
          "file": "./dist"
        }
      },
      "fail": {
        "message": "빌드 출력을 찾을 수 없습니다"
      }
    },
    {
      "run": "echo \"Deploying {{projectName}} version {{version}} to {{env}}\""
    }
  ]
}
```

## 기능 설명

이 예제에서 사용된 기능들:

1. **기본 명령 실행** (`run`)
2. **사용자 선택** (`choose`) - 변수 저장 (`as`)
3. **조건부 프롬프트** (`when` + `prompt`)
4. **변수 값 비교** (`var` 객체)
5. **복잡한 조건** (`all`)
6. **병렬 실행** (`parallel`)
7. **파일 존재 확인** (`file`)
8. **OR 조건** (`any`)
9. **부정 조건** (`not`)
10. **변수 치환** (`{{variable}}`)

## 실행

이 워크플로우를 실행하려면:

```bash
tp run complete-example.yaml
```

또는 JSON 형식:

```bash
tp run complete-example.json
```

## 다음 단계

- **[예제](/docs/examples)** - 더 많은 예제 보기
- **[DSL 참조](/docs/dsl-reference/workflow-structure)** - 완전한 문법 가이드
