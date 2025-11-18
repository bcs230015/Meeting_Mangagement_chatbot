
import React from 'react';

export const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9.5 14c-.83 0-1.5-.67-1.5-1.5S8.67 11 9.5 11s1.5.67 1.5 1.5S10.33 14 9.5 14zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 11 14.5 11s1.5.67 1.5 1.5S15.33 14 14.5 14zm2.5-4H7v-2h10v2z" />
  </svg>
);
