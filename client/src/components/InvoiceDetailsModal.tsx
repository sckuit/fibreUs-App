import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { Invoice, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, FileText, DollarSign, CreditCard, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
}

interface InvoiceItem {
  priceMatrixId?: string;
  itemName: string;
  description: string;
  unit?: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose, recipientName }: InvoiceDetailsModalProps) {
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;
  const { toast } = useToast();

  const generateShareLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/invoices/${invoice!.id}/share`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      const shareUrl = `${window.location.origin}/invoice/${data.invoiceNumber}/${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied to clipboard!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate share link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!invoice) return null;

  const items = Array.isArray(invoice.items) ? (invoice.items as InvoiceItem[]) : [];
  const isClient = typedUser?.role === 'client';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'sent':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'partial':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'partial':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'unpaid':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            Invoice {invoice.invoiceNumber}
          </DialogTitle>
          {recipientName && (
            <DialogDescription>
              {recipientName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={getStatusColor(invoice.status)}>
              {getStatusLabel(invoice.status)}
            </Badge>
            <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
              Payment: {getStatusLabel(invoice.paymentStatus)}
            </Badge>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            {/* Invoice Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Invoice Date</span>
              </div>
              <p className="text-sm font-medium">{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</p>
            </div>

            {/* Due Date */}
            {invoice.dueDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Due Date</span>
                </div>
                <p className="text-sm font-medium">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>
              </div>
            )}

            {/* Total */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Total</span>
              </div>
              <p className="text-sm font-medium">{formatCurrency(invoice.total)}</p>
            </div>

            {/* Amount Paid */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>Paid</span>
              </div>
              <p className="text-sm font-medium">{formatCurrency(invoice.amountPaid || '0')}</p>
            </div>

            {/* Balance Due */}
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Balance Due</span>
              </div>
              <p className="text-lg font-bold text-primary">{formatCurrency(invoice.balanceDue || '0')}</p>
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
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({invoice.taxRate}%):</span>
              <span className="font-medium">{formatCurrency(invoice.taxAmount || '0')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Share Link Button for Staff */}
          {!isClient && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => generateShareLinkMutation.mutate()}
                  disabled={generateShareLinkMutation.isPending}
                  data-testid="button-share-invoice-link"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {generateShareLinkMutation.isPending ? 'Generating...' : 'Share Link'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
