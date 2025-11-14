import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function PrintPreviewDialog({ open, onOpenChange, title, children }: PrintPreviewDialogProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<'0.5in' | '1in' | '1.5in'>('0.5in');
  const printRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const handlePrint = () => {
    if (styleRef.current) {
      const pageRule = `@page { margin: ${margin}; size: letter ${orientation}; }`;
      const existingStyle = styleRef.current.textContent || '';
      const updatedStyle = existingStyle.replace(/@page\s*{[^}]*}/, pageRule);
      styleRef.current.textContent = updatedStyle;
    }
    
    setTimeout(() => {
      window.print();
    }, 100);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print-preview-dialog bg-white dark:bg-white text-slate-900 dark:text-slate-900">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-slate-900">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="print:hidden space-y-4 pb-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="orientation-select" className="text-sm text-slate-700">Orientation</Label>
              <Select value={orientation} onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}>
                <SelectTrigger id="orientation-select" className="mt-1" data-testid="select-orientation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="margin-select" className="text-sm text-slate-700">Margins</Label>
              <Select value={margin} onValueChange={(value: '0.5in' | '1in' | '1.5in') => setMargin(value)}>
                <SelectTrigger id="margin-select" className="mt-1" data-testid="select-margins">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5in">0.5 inch (Narrow)</SelectItem>
                  <SelectItem value="1in">1 inch (Normal)</SelectItem>
                  <SelectItem value="1.5in">1.5 inch (Wide)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div ref={printRef} className="print-content">
          {children}
        </div>

        <DialogFooter className="print:hidden">
          <Button 
            onClick={handlePrint} 
            className="w-full"
            data-testid="button-dialog-print"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </DialogFooter>

        <style ref={styleRef}>{`
          @media print {
            /* Hide everything except the dialog content when printing */
            body.printing {
              overflow: visible !important;
            }
            
            /* Hide all non-portal elements - preserve portal and its descendants */
            body.printing > * {
              display: none !important;
            }
            
            body.printing > [data-radix-portal] {
              display: block !important;
            }
            
            /* Ensure Radix portal is visible and takes full page */
            body.printing [data-radix-portal] {
              position: static !important;
              transform: none !important;
            }
            
            /* Make dialog take full page */
            body.printing .print-preview-dialog {
              position: static !important;
              transform: none !important;
              max-width: 100% !important;
              max-height: none !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              overflow: visible !important;
            }
            
            /* Hide dialog chrome */
            body.printing [class*="DialogHeader"],
            body.printing [class*="DialogFooter"],
            body.printing button,
            body.printing .print\\:hidden {
              display: none !important;
            }
            
            /* Make print content take full width */
            body.printing .print-content {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
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
            
            /* Remove card styling for print */
            .print-content [class*="Card"] {
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            
            /* Ensure colors print correctly */
            * {
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Page setup - dynamically updated by handlePrint */
            @page {
              margin: ${margin};
              size: letter ${orientation};
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
