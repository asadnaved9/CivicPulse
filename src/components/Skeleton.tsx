import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '16px', 
  borderRadius = '4px',
  className = '',
  style
}) => {
  return (
    <div 
      className={`shimmer ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius,
        ...style 
      }}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Skeleton width="40%" height="20px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="80%" height="14px" />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Skeleton width="60px" height="24px" borderRadius="4px" />
        <Skeleton width="80px" height="24px" borderRadius="4px" />
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <Skeleton width="48px" height="48px" borderRadius="8px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="30%" height="16px" />
            <Skeleton width="70%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
};
