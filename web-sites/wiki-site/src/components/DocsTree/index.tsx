import useGlobalData from '@docusaurus/useGlobalData';
import React from 'react';
import styles from './index.module.scss';
import Link from '@docusaurus/Link';

export default function DocsTree() {
  const globalData = useGlobalData();

  const contentData = globalData['docusaurus-plugin-content-docs']['default'] as any;
  const docs = contentData.versions?.[0].docs;

  return (
    <div className="flex flex-wrap">
      {docs?.map((item) => {
        const nameList = item.id.split('/');
        const lastName = nameList[nameList.length - 1];
        return lastName ? (
          <Link
            key={item.id}
            to={item.path}
            style={{
              textDecoration: 'none',
              color: '#666',
            }}
          >
            <div className={styles.tagItem}>{lastName}</div>
          </Link>
        ) : null;
      })}
    </div>
  );
}
