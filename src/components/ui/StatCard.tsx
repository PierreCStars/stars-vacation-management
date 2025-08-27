'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Card from './Card';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaText: string;
  ctaHref: string;
  className?: string;
}

export default function StatCard({ icon, title, description, ctaText, ctaHref, className = '' }: StatCardProps) {
  return (
    <Card className={`text-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 text-brand-600">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}
        <Link 
          href={ctaHref}
          className="btn-primary"
        >
          {ctaText}
        </Link>
      </div>
    </Card>
  );
}
