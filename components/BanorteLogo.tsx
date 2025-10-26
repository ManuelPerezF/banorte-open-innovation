import React from 'react';

interface BanorteLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BanorteLogo = ({ className = '', size = 'md' }: BanorteLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 1330 895" className="w-full h-full">
        <path d="M735.696 0C408.081 0 142.541 91.3265 142.541 204.571C142.541 299.551 327.615 378.701 579.36 401.837L682.818 64.5373L701.21 407.926C712.705 407.926 724.201 407.926 736.845 407.926C1064.46 407.926 1330 316.599 1330 203.354C1328.85 92.5441 1063.31 0 735.696 0Z" fill="#E31C23"/>
        <path d="M575.912 414.013C256.344 417.666 0 524.823 0 657.551C0 769.578 181.625 863.34 429.922 892.565L575.912 414.013Z" fill="#E31C23"/>
        <path d="M700.06 417.666L725.35 895C988.591 870.646 1184.01 773.231 1184.01 657.551C1185.16 538.217 975.946 438.367 700.06 417.666Z" fill="#E31C23"/>
      </svg>
    </div>
  );
};

export default BanorteLogo;