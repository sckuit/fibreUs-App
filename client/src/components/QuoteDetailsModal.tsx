import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { Quote, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, FileText, DollarSign, CheckCircle, XCircle, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;
  const { toast } = useToast();

  const approveQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/quotes/${quote!.id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote approved",
        description: "The quote has been accepted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/quotes/${quote!.id}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote rejected",
        description: "The quote has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateShareLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/quotes/${quote!.id}/share`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      const shareUrl = `${window.location.origin}/quote/${data.quoteNumber}/${data.token}`;
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

  if (!quote) return null;

  const items = Array.isArray(quote.items) ? (quote.items as QuoteItem[]) : [];
  const isClient = typedUser?.role === 'client';
  const canApproveReject = isClient && (quote.status === 'draft' || quote.status === 'sent');

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

          {/* Approve/Reject Actions for Clients */}
          {canApproveReject && (
            <>
              <Separator />
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="text-sm font-semibold">Quote Decision</h4>
                <p className="text-sm text-muted-foreground">
                  Please review the quote details and either approve or reject this proposal.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => approveQuoteMutation.mutate()}
                    disabled={approveQuoteMutation.isPending || rejectQuoteMutation.isPending}
                    className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border border-green-700 dark:border-green-700"
                    data-testid="button-approve-quote"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {approveQuoteMutation.isPending ? 'Approving...' : 'Approve Quote'}
                  </Button>
                  <Button
                    onClick={() => rejectQuoteMutation.mutate()}
                    disabled={approveQuoteMutation.isPending || rejectQuoteMutation.isPending}
                    variant="destructive"
                    className="flex-1 min-w-[150px]"
                    data-testid="button-reject-quote"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {rejectQuoteMutation.isPending ? 'Rejecting...' : 'Reject Quote'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Share Link Button for Staff */}
          {!isClient && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateShareLinkMutation.mutate()}
                  disabled={generateShareLinkMutation.isPending}
                  data-testid="button-share-quote-link"
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
