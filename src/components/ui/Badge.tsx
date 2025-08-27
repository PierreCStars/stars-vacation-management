'use client';

interface BadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span 
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold
        border ${getStatusStyles(status)} ${className}
      `}
    >
      {status}
    </span>
  );
}
