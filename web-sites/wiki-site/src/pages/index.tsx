import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.scss';
import Wave from '../components/Wave';
import BlobFish from '../components/Objects/blob-fish';

function HomepageHeader() {
  return (
    <div className={clsx('hero', styles.heroBanner)}>
      <BlobFish></BlobFish>
      {/* <div className={styles.wave}>
        <Wave />
      </div> */}
    </div>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={`jeiiz's ${siteConfig.title}`}>
      <HomepageHeader></HomepageHeader>
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
