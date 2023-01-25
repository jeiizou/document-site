import React from 'react';

type WaveSvgProps = {
  // HOLD
};

export default function WaveSvg({}: WaveSvgProps): React.ReactElement {
  return (
    <div className="ocean">
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
  );
}
