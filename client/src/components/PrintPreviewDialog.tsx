import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function PrintPreviewDialog({ open, onOpenChange, title, children }: PrintPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('printing');
    };

    const handleAfterPrint = () => {
      document.body.classList.remove('printing');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print-preview-dialog">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button 
              onClick={handlePrint} 
              size="sm"
              data-testid="button-print"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogHeader>
        <div ref={printRef} className="print-content">
          {children}
        </div>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content,
            .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            /* Hide dialog chrome when printing */
            .print-preview-dialog > div:first-child {
              box-shadow: none !important;
              max-height: none !important;
              height: auto !important;
            }
            /* Hide interactive elements */
            button, .print\\:hidden {
              display: none !important;
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
            /* Remove margins from cards for print */
            .print-content [class*="Card"] {
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            /* Ensure good contrast in print */
            * {
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Page setup */
            @page {
              margin: 0.5in;
              size: letter portrait;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
