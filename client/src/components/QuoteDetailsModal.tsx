import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Quote } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, FileText, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface QuoteDetailsModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
}

interface QuoteItem {
  priceMatrixId?: string;
  itemName: string;
  description: string;
  unit?: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

export function QuoteDetailsModal({ quote, isOpen, onClose, recipientName }: QuoteDetailsModalProps) {
  if (!quote) return null;

  const items = Array.isArray(quote.items) ? (quote.items as QuoteItem[]) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'sent':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'draft':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'expired':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" data-testid="dialog-quote-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            Quote {quote.quoteNumber}
          </DialogTitle>
          {recipientName && (
            <DialogDescription>
              {recipientName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={getStatusColor(quote.status)}>
              {getStatusLabel(quote.status)}
            </Badge>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            {/* Created Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created</span>
              </div>
              <p className="text-sm font-medium">{format(new Date(quote.createdAt), 'MMM d, yyyy')}</p>
            </div>

            {/* Valid Until */}
            {quote.validUntil && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Valid Until</span>
                </div>
                <p className="text-sm font-medium">{format(new Date(quote.validUntil), 'MMM d, yyyy')}</p>
              </div>
            )}

            {/* Total */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Total</span>
              </div>
              <p className="text-lg font-bold text-primary">{formatCurrency(quote.total)}</p>
            </div>
          </div>

          {/* Line Items */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Line Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({quote.taxRate}%):</span>
              <span className="font-medium">{formatCurrency(quote.taxAmount || '0')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
