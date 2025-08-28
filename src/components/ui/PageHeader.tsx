'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={`flex flex-col items-center gap-4 py-8 ${className ?? ''}`}>
      <div className="h-12 w-auto">
        <Image 
          src="/stars-logo.png" 
          alt="Stars" 
          width={120} 
          height={30} 
          style={{ height: 'auto' }} 
          priority 
        />
      </div>
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">{title}</h1>
        {description && (
          <p className="text-lg text-gray-600 mt-2">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
