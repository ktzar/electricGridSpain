import React from 'react';
import './InfoIconTooltip.css';

interface InfoIconTooltipProps {
  text: string;
}

const InfoIconTooltip = ({text} : InfoIconTooltipProps) => {
  return (
    <div className="info-icon-tooltip">
      <span className="info-icon">&#9432;</span>
      <div className="tooltip">{text}</div>
    </div>
  );
};

export default InfoIconTooltip;
