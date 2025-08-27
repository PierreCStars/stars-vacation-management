'use client';

import Image from 'next/image';

export default function PageHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
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
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">{title}</h1>
    </div>
  );
}
