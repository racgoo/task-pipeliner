import type {ReactNode} from 'react';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function HomepageCodeExample(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';

  const codeExample = isEnglish
    ? `name: Build and Deploy

baseDir: ./

steps:
  # 1. User choice
  - choose:
      message: "Select deployment environment:"
      options:
        - id: dev
          label: "Development"
        - id: prod
          label: "Production"
      as: env

  # 2. Conditional execution
  - when:
      var:
        env: dev
    run: 'npm run build:dev'

  - when:
      var:
        env: prod
    run: 'npm run build:prod'

  # 3. Parallel execution
  - parallel:
      - run: 'npm test'
      - run: 'npm run lint'

  # 4. Deploy after file check
  - when:
      file: ./dist
    run: 'npm run deploy'`
    : `name: Build and Deploy

baseDir: ./

steps:
  # 1. 사용자 선택
  - choose:
      message: "배포 환경을 선택하세요:"
      options:
        - id: dev
          label: "개발"
        - id: prod
          label: "프로덕션"
      as: env

  # 2. 조건부 실행
  - when:
      var:
        env: dev
    run: 'npm run build:dev'

  - when:
      var:
        env: prod
    run: 'npm run build:prod'

  # 3. 병렬 실행
  - parallel:
      - run: 'npm test'
      - run: 'npm run lint'

  # 4. 파일 확인 후 배포
  - when:
      file: ./dist
    run: 'npm run deploy'`;

  return (
    <section className={styles.codeExample}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <h2 className={styles.title}>
              <Translate id="homepage.codeExample.title">간단한 YAML로 시작하세요</Translate>
            </h2>
            <p className={styles.subtitle}>
              <Translate id="homepage.codeExample.subtitle">
                복잡한 스크립트 대신, 선언적인 YAML로 워크플로우를 정의합니다.
              </Translate>
            </p>
          </div>
        </div>
        <div className="row">
          <div className="col col--12">
            <div className={styles.codeBlock}>
              <div className={styles.codeBlockHeader}>
                <span className={styles.codeBlockTitle}>workflow.yaml</span>
              </div>
              <pre className={styles.codeBlockContent}>
                <code>{codeExample}</code>
              </pre>
            </div>
            <div className={styles.codeBlockFooter}>
              <div className={styles.terminalPrompt}>
                <span className={styles.terminalPromptSymbol}>$</span>
                <code className={styles.terminalCommand}>
                  task-pipeliner run workflow.yaml
                </code>
                <span className={styles.terminalCursor}>▋</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

