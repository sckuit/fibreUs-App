import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotePreview } from "@/components/QuotePreview";
import { AlertCircle, CheckCircle, XCircle, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemConfig } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { Quote } from "@shared/schema";

interface QuoteWithToken extends Quote {
  items: any;
}

export default function PublicQuoteView() {
  const [match, params] = useRoute("/quote/:quoteNumber/:token");
  const { toast} = useToast();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ["/api/system-config"],
  });

  const { data: quote, isLoading, error } = useQuery<QuoteWithToken>({
    queryKey: ["/api/public/quote", params?.quoteNumber, params?.token],
    enabled: !!params?.token && !!params?.quoteNumber && !!match,
  });

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/public/quote/${params?.quoteNumber}/${params?.token}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/quote", params?.quoteNumber, params?.token] });
      toast({
        title: "Quote Approved",
        description: "Thank you! We've received your approval and will be in touch soon.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve quote. Please try again or contact us directly.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => 
      apiRequest("POST", `/api/public/quote/${params?.quoteNumber}/${params?.token}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/quote", params?.quoteNumber, params?.token] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      toast({
        title: "Quote Rejected",
        description: "We've received your response. Thank you for your consideration.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject quote. Please try again or contact us directly.",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    rejectMutation.mutate(rejectionReason);
  };

  if (!match || !params?.token || !params?.quoteNumber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Invalid Link</h2>
              <p className="text-muted-foreground">
                The quote link appears to be invalid. Please check your link or contact us for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" data-testid="skeleton-title" />
          <Card>
            <CardContent className="p-8 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold" data-testid="text-error-title">
                {is404 ? "Quote Not Found" : "Error Loading Quote"}
              </h2>
              <p className="text-muted-foreground" data-testid="text-error-message">
                {is404 
                  ? "This quote link may have expired or is no longer available. Please contact us for assistance."
                  : "We encountered an error loading this quote. Please try again or contact us for assistance."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canTakeAction = quote.status === 'sent' || quote.status === 'draft';
  const isAccepted = quote.status === 'accepted';
  const isRejected = quote.status === 'rejected';

  const companyName = systemConfig?.companyName || "FibreUS";
  const companyPhone = systemConfig?.phoneNumber || "";
  const companyEmail = systemConfig?.contactEmail || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="bg-[#1e3a5f] text-white border-b border-[#2a4a6f]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{companyName}</h1>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {companyPhone && (
                <a href={`tel:${companyPhone}`} className="flex items-center gap-2 hover-elevate px-3 py-1.5 rounded-md transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>{companyPhone}</span>
                </a>
              )}
              {companyEmail && (
                <a href={`mailto:${companyEmail}`} className="flex items-center gap-2 hover-elevate px-3 py-1.5 rounded-md transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>{companyEmail}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold" data-testid="text-quote-title">Quote Review</h2>
          <p className="text-muted-foreground">
            Please review the quote details below
          </p>
        </div>

        {isAccepted && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium" data-testid="text-quote-approved">
                  This quote has been approved. We will contact you shortly to proceed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <p className="font-medium" data-testid="text-quote-rejected">
                  This quote has been declined. Thank you for your consideration.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <QuotePreview
          items={Array.isArray(quote.items) ? quote.items : []}
          subtotal={quote.subtotal || "0"}
          taxRate={quote.taxRate || "0"}
          taxAmount={quote.taxAmount || "0"}
          total={quote.total || "0"}
          validUntil={quote.validUntil ? new Date(quote.validUntil).toISOString() : undefined}
          notes={quote.notes || undefined}
          leadId={quote.leadId || undefined}
          clientId={quote.clientId || undefined}
          quoteNumber={quote.quoteNumber}
        />

        {canTakeAction && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Please review the quote and let us know if you would like to proceed
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid="button-approve-quote"
                    className="flex-1 sm:flex-none"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {approveMutation.isPending ? "Approving..." : "Approve Quote"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid="button-reject-quote"
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline Quote
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-quote">
          <DialogHeader>
            <DialogTitle>Decline Quote</DialogTitle>
            <DialogDescription>
              We're sorry to hear this quote doesn't meet your needs. Would you like to share why? (Optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="rejection-reason">Reason (Optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Let us know why this quote doesn't work for you..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={rejectMutation.isPending}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Declining..." : "Decline Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
