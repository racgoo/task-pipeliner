import type {ReactNode} from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <h2 className={styles.sectionTitle}>
              <Translate id="homepage.features.title">주요 기능</Translate>
            </h2>
            <p className={styles.sectionSubtitle}>
              <Translate id="homepage.features.subtitle">
                task-pipeliner가 제공하는 강력한 기능들을 확인하세요
              </Translate>
            </p>
          </div>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <span className={styles.featureEmoji}>🎯</span>
              <Heading as="h3" className={styles.featureTitle}>
                <Translate id="homepage.features.conditional.title">조건 기반 실행</Translate>
              </Heading>
            </div>
            <p className={styles.featureDescription}>
              <Translate id="homepage.features.conditional.description">파일 존재 여부, 사용자 선택, 환경 변수 등을 기반으로 단계 실행</Translate>
            </p>
            <ul className={styles.featureDetails}>
              <li>
                <Translate id="homepage.features.conditional.detail1">파일 존재 확인</Translate>
              </li>
              <li>
                <Translate id="homepage.features.conditional.detail2">변수 값 비교</Translate>
              </li>
              <li>
                <Translate id="homepage.features.conditional.detail3">사용자 선택 확인</Translate>
              </li>
              <li>
                <Translate id="homepage.features.conditional.detail4">all/any/not으로 복잡한 논리</Translate>
              </li>
            </ul>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <span className={styles.featureEmoji}>⚡</span>
              <Heading as="h3" className={styles.featureTitle}>
                <Translate id="homepage.features.parallel.title">병렬 실행</Translate>
              </Heading>
            </div>
            <p className={styles.featureDescription}>
              <Translate id="homepage.features.parallel.description">여러 작업을 동시에 실행하여 시간을 절약합니다</Translate>
            </p>
            <ul className={styles.featureDetails}>
              <li>
                <Translate id="homepage.features.parallel.detail1">여러 단계를 동시에 실행</Translate>
              </li>
              <li>
                <Translate id="homepage.features.parallel.detail2">브랜치별 격리된 워크스페이스 상태</Translate>
              </li>
              <li>
                <Translate id="homepage.features.parallel.detail3">모든 단계 완료까지 대기</Translate>
              </li>
              <li>
                <Translate id="homepage.features.parallel.detail4">어떤 단계라도 실패하면 중지</Translate>
              </li>
            </ul>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <span className={styles.featureEmoji}>💬</span>
              <Heading as="h3" className={styles.featureTitle}>
                <Translate id="homepage.features.prompt.title">대화형 프롬프트</Translate>
              </Heading>
            </div>
            <p className={styles.featureDescription}>
              <Translate id="homepage.features.prompt.description">실행 중 사용자에게 입력과 선택을 요청</Translate>
            </p>
            <ul className={styles.featureDetails}>
              <li>
                <Translate id="homepage.features.prompt.detail1">텍스트 입력 프롬프트</Translate>
              </li>
              <li>
                <Translate id="homepage.features.prompt.detail2">선택 메뉴</Translate>
              </li>
              <li>
                <Translate id="homepage.features.prompt.detail3">기본값 지원</Translate>
              </li>
              <li>
                <Translate id="homepage.features.prompt.detail4">결과를 변수로 저장</Translate>
              </li>
            </ul>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <span className={styles.featureEmoji}>🎨</span>
              <Heading as="h3" className={styles.featureTitle}>
                <Translate id="homepage.features.output.title">아름다운 출력</Translate>
              </Heading>
            </div>
            <p className={styles.featureDescription}>
              <Translate id="homepage.features.output.description">색상과 포맷팅이 적용된 실시간 터미널 출력</Translate>
            </p>
            <ul className={styles.featureDetails}>
              <li>
                <Translate id="homepage.features.output.detail1">색상 코딩된 출력</Translate>
              </li>
              <li>
                <Translate id="homepage.features.output.detail2">실시간 스트리밍</Translate>
              </li>
              <li>
                <Translate id="homepage.features.output.detail3">포맷팅된 단계 표시</Translate>
              </li>
              <li>
                <Translate id="homepage.features.output.detail4">오류 강조</Translate>
              </li>
            </ul>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <span className={styles.featureEmoji}>🔄</span>
              <Heading as="h3" className={styles.featureTitle}>
                <Translate id="homepage.features.variables.title">변수 치환</Translate>
              </Heading>
            </div>
            <p className={styles.featureDescription}>
              <Translate id="homepage.features.variables.description" />
            </p>
            <ul className={styles.featureDetails}>
              <li>
                <Translate id="homepage.features.variables.detail1" />
              </li>
              <li>
                <Translate id="homepage.features.variables.detail2" />
              </li>
              <li>
                <Translate id="homepage.features.variables.detail3">조건에서 확인</Translate>
              </li>
              <li>
                <Translate id="homepage.features.variables.detail4">대소문자 구분 변수 이름</Translate>
              </li>
            </ul>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <span className={styles.featureEmoji}>📁</span>
              <Heading as="h3" className={styles.featureTitle}>
                <Translate id="homepage.features.baseDir.title">기본 디렉토리</Translate>
              </Heading>
            </div>
            <p className={styles.featureDescription}>
              <Translate id="homepage.features.baseDir.description">모든 명령 실행을 위한 기본 디렉토리 설정</Translate>
            </p>
            <ul className={styles.featureDetails}>
              <li>
                <Translate id="homepage.features.baseDir.detail1">상대 또는 절대 경로</Translate>
              </li>
              <li>
                <Translate id="homepage.features.baseDir.detail2">워크플로우 파일 위치 기준으로 해석</Translate>
              </li>
              <li>
                <Translate id="homepage.features.baseDir.detail3">모든 명령이 baseDir에서 실행</Translate>
              </li>
              <li>
                <Translate id="homepage.features.baseDir.detail4">선택사항 - 기본값은 현재 디렉토리</Translate>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
