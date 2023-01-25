import useGlobalData from '@docusaurus/useGlobalData';
import React from 'react';
import styles from './index.module.scss';
import Link from '@docusaurus/Link';

export default function DocsTree() {
  const globalData = useGlobalData();

  const contentData = globalData['docusaurus-plugin-content-docs']['default'] as any;
  const docs = contentData.versions?.[0].docs;

  return (
    <span
      style={{
        borderRadius: '2px',
        padding: '0.2rem',
      }}
    >
      <div className="flex flex-wrap">
        {docs?.map((item) => {
          const pathList = item.path.split('/');
          const lastName = pathList[pathList.length - 1];
          return lastName ? (
            <Link key={item.id} to={item.path}>
              <div className={styles.tagItem}>{pathList[pathList.length - 1]}</div>
            </Link>
          ) : null;
        })}
      </div>
    </span>
  );
}
