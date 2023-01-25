import React from 'react';
import styles from './style.module.scss';
import clsx from 'clsx';

type WaveProps = {
  // HOLD
};

export default function Wave({}: WaveProps): React.ReactElement {
  return (
    <div className={styles.wave}>
      <div className={clsx(styles['wave-base'], styles.wave1)}></div>
      <div className={clsx(styles['wave-base'], styles.wave2)}></div>
      <div className={clsx(styles['wave-base'], styles.wave3)}></div>
      <div className={clsx(styles['wave-base'], styles.wave4)}></div>
      <div className={clsx(styles['wave-base'], styles.wave5)}></div>
    </div>
  );
}
