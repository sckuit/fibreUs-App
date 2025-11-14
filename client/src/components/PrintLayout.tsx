import { useQuery } from "@tanstack/react-query";
import type { SystemConfig } from "@shared/schema";
import { Shield } from "lucide-react";

interface PrintLayoutProps {
  children: React.ReactNode;
}

export function PrintLayout({ children }: PrintLayoutProps) {
  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const companyName = systemConfig?.companyName || "FibreUS";
  const logoUrl = systemConfig?.logoUrl;
  const website = systemConfig?.website;
  const phoneNumber = systemConfig?.phoneNumber;
  const contactEmail = systemConfig?.contactEmail;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Blue Header */}
      <header className="bg-primary text-primary-foreground print:bg-primary print:text-primary-foreground p-6 print-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <Shield className="h-12 w-12" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="text-sm opacity-90">Electronic Security & Fiber Optic Services</p>
            </div>
          </div>
        </div>
      </header>

      {/* White Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        {children}
      </main>

      {/* Blue Footer */}
      <footer className="bg-primary text-primary-foreground print:bg-primary print:text-primary-foreground p-6 print-footer mt-auto">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p className="text-sm font-medium">{companyName}</p>
          <div className="flex items-center justify-center gap-4 text-xs opacity-90">
            {website && <span>{website}</span>}
            {phoneNumber && <span>•</span>}
            {phoneNumber && <span>{phoneNumber}</span>}
            {contactEmail && <span>•</span>}
            {contactEmail && <span>{contactEmail}</span>}
          </div>
          <p className="text-xs opacity-75">Professional Security & Fiber Optic Installation Services</p>
        </div>
      </footer>

      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: letter portrait;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .print-header,
          .print-footer {
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Optimize page breaks */
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  );
}
