import { ReactNode } from 'react';

export default function ActionCard({
  icon, 
  title, 
  desc, 
  action
}: { 
  icon: ReactNode; 
  title: string; 
  desc: string; 
  action: ReactNode; 
}) {
  return (
    <div className="rounded-2xl bg-white shadow-card p-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gray-100 grid place-items-center text-gray-700">
          {icon}
        </div>
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        <p className="text-sm text-gray-600">{desc}</p>
        <div className="mt-2">{action}</div>
      </div>
    </div>
  );
}


