import React, { useState } from 'react';
import styles from './LichSu.module.css';
import DonationHistory from '../../components/DonationHistory/DonationHistory';
import ReceptionHistory from '../../components/ReceptionHistory/ReceptionHistory';

function LichSu() {
  const [selected, setSelected] = useState('donation');

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <div
          className={`${styles.optionBox} ${selected === 'donation' ? styles.selected : ''}`}
          onClick={() => setSelected('donation')}
        >
          Lịch sử hiến
        </div>
        <div
          className={`${styles.optionBox} ${selected === 'reception' ? styles.selected : ''}`}
          onClick={() => setSelected('reception')}
        >
          Lịch sử nhận
        </div>
      </div>

      <div className={styles.right}>
        {selected === 'donation' && <DonationHistory />}
        {selected === 'reception' && <ReceptionHistory />}
      </div>
    </div>
  );
}

export default LichSu;
