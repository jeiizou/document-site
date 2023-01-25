import React from 'react';
import './index.scss';

type BlobFishProps = {
  // HOLD
};

export default function BlobFish({}: BlobFishProps): React.ReactElement {
  return (
    <div className="water">
      <div className="fish">
        <div className="face">
          <div className="left-fin"></div>
          <div className="mouth"></div>
          <div className="nose"></div>
          <div className="right-fin">bl</div>
        </div>
      </div>
    </div>
  );
}
