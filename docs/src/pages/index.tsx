import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HomepageCodeExample from '@site/src/components/HomepageCodeExample';
import HomepageUseCases from '@site/src/components/HomepageUseCases';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline">강력한 워크플로우 오케스트레이션 도구</Translate>
        </p>
        <p className={styles.heroDescription}>
          <Translate id="homepage.hero.description">
            간단한 YAML 또는 JSON 파일로 복잡한 워크플로우를 정의, 조율, 실행하는 현대적인 오케스트레이션 도구. 조건부 실행, 병렬 작업, 대화형 프롬프트, 그리고 아름다운 터미널 출력을 제공합니다.
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started">
            <Translate id="homepage.hero.quickStart">빠른 시작</Translate> →
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/dsl-reference/workflow-structure">
            <Translate id="homepage.hero.dslReference">DSL 참조</Translate> →
          </Link>
        </div>
        <div className={styles.installCommand}>
          <code>npm install -g task-pipeliner</code>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig, i18n} = useDocusaurusContext();
  const tagline = translate({
    id: 'homepage.tagline',
    message: i18n.currentLocale === 'ko' ? '강력한 워크플로우 오케스트레이션 도구' : 'Powerful Workflow Orchestration Tool',
  });
  const description = translate({
    id: 'homepage.hero.description',
    message: i18n.currentLocale === 'en'
      ? 'A modern workflow orchestration tool that lets you define, coordinate, and execute complex workflows using simple YAML or JSON files. Supports conditional execution, parallel processing, interactive prompts, and beautiful terminal output.'
      : '간단한 YAML 또는 JSON 파일로 복잡한 워크플로우를 정의, 조율, 실행하는 현대적인 오케스트레이션 도구. 조건부 실행, 병렬 작업, 대화형 프롬프트, 그리고 아름다운 터미널 출력을 제공합니다.',
  });
  return (
    <Layout
      title={`${siteConfig.title} - ${tagline}`}
      description={description}>
      <HomepageHeader />
      <main>
        <HomepageCodeExample />
        <HomepageFeatures />
        <HomepageUseCases />
      </main>
    </Layout>
  );
}
