interface PrintLayoutProps {
  children: React.ReactNode;
}

export function PrintLayout({ children }: PrintLayoutProps) {
  return (
    <>
      {children}

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
          
          .print-blue-section {
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
    </>
  );
}
