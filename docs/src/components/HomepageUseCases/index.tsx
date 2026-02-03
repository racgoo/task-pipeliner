import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function HomepageUseCases(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';

  return (
    <section className={styles.useCases}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <h2 className={styles.sectionTitle}>
              <Translate id="homepage.useCases.title">사용 사례</Translate>
            </h2>
            <p className={styles.sectionSubtitle}>
              <Translate id="homepage.useCases.subtitle">
                task-pipeliner로 해결할 수 있는 다양한 시나리오
              </Translate>
            </p>
          </div>
        </div>
        <div className={styles.useCasesGrid}>
          <div className={styles.useCaseCard}>
            <h3 className={styles.useCaseTitle}>
              <Translate id="homepage.useCases.cicd.title">CI/CD 파이프라인</Translate>
            </h3>
            <p className={styles.useCaseDescription}>
              <Translate id="homepage.useCases.cicd.description">빌드, 테스트, 배포 워크플로우 자동화</Translate>
            </p>
            <div className={styles.useCaseExample}>
              <span className={styles.useCaseExampleLabel}>
                <Translate id="homepage.useCases.exampleLabel">예시:</Translate>
              </span>
              <span>
                <Translate id="homepage.useCases.cicd.example">cicd.yaml</Translate>
              </span>
            </div>
            <Link
              className={styles.useCaseLink}
              to={`/docs/examples${isEnglish ? '#cicd-pipeline' : '#cicd-파이프라인'}`}>
              <Translate id="homepage.useCases.viewExample">예제 보기</Translate> →
            </Link>
          </div>
          <div className={styles.useCaseCard}>
            <h3 className={styles.useCaseTitle}>
              <Translate id="homepage.useCases.monorepo.title">모노레포 워크플로우</Translate>
            </h3>
            <p className={styles.useCaseDescription}>
              <Translate id="homepage.useCases.monorepo.description">단일 저장소에서 여러 프로젝트 관리</Translate>
            </p>
            <div className={styles.useCaseExample}>
              <span className={styles.useCaseExampleLabel}>
                <Translate id="homepage.useCases.exampleLabel">예시:</Translate>
              </span>
              <span>
                <Translate id="homepage.useCases.monorepo.example">monorepo-example/</Translate>
              </span>
            </div>
            <Link
              className={styles.useCaseLink}
              to="/docs/examples#monorepo-example">
              <Translate id="homepage.useCases.viewExample">예제 보기</Translate> →
            </Link>
          </div>
          <div className={styles.useCaseCard}>
            <h3 className={styles.useCaseTitle}>
              <Translate id="homepage.useCases.devEnv.title">개발 환경</Translate>
            </h3>
            <p className={styles.useCaseDescription}>
              <Translate id="homepage.useCases.devEnv.description">개발 환경 설정 및 관리</Translate>
            </p>
            <div className={styles.useCaseExample}>
              <span className={styles.useCaseExampleLabel}>
                <Translate id="homepage.useCases.exampleLabel">예시:</Translate>
              </span>
              <span>
                <Translate id="homepage.useCases.devEnv.example">simple-project/</Translate>
              </span>
            </div>
            <Link
              className={styles.useCaseLink}
              to="/docs/examples#simple-project">
              <Translate id="homepage.useCases.viewExample">예제 보기</Translate> →
            </Link>
          </div>
          <div className={styles.useCaseCard}>
            <h3 className={styles.useCaseTitle}>
              <Translate id="homepage.useCases.interactive.title">대화형 스크립트</Translate>
            </h3>
            <p className={styles.useCaseDescription}>
              <Translate id="homepage.useCases.interactive.description">사용자 프롬프트와 선택이 있는 대화형 스크립트 생성</Translate>
            </p>
            <div className={styles.useCaseExample}>
              <span className={styles.useCaseExampleLabel}>
                <Translate id="homepage.useCases.exampleLabel">예시:</Translate>
              </span>
              <span>
                <Translate id="homepage.useCases.interactive.example">prompt.yaml, choose.yaml</Translate>
              </span>
            </div>
            <Link
              className={styles.useCaseLink}
              to="/docs/examples">
              <Translate id="homepage.useCases.viewExample">예제 보기</Translate> →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
