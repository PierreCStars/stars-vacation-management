import React from 'react';
import { COMPANY_COLORS } from '../../lib/company-colors';

interface CompanyLegendProps {
  title?: string;
  className?: string;
  compact?: boolean;
}

export default function CompanyLegend({ 
  title = "Company Legend", 
  className = "",
  compact = false 
}: CompanyLegendProps) {
  return (
    <div className={`bg-gray-50 p-4 border border-gray-200 rounded-lg ${className}`}>
      <h4 className="font-semibold text-gray-700 mb-3 text-sm">
        {title}
      </h4>
      <div className={`grid gap-2 ${
        compact 
          ? 'grid-cols-2 md:grid-cols-3' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {Object.entries(COMPANY_COLORS).map(([companyCode, company]) => (
          <div 
            key={companyCode} 
            className="flex items-center space-x-2 text-xs"
          >
            <div 
              className="w-3 h-3 rounded border border-gray-300"
              style={{ backgroundColor: company.hex }}
            />
            <span className="text-gray-600 font-medium">
              {company.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
