import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicePreview } from "@/components/InvoicePreview";
import { AlertCircle, FileText, Phone, Mail, CheckCircle, Clock, DollarSign } from "lucide-react";
import type { Invoice, SystemConfig, User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";

interface InvoiceWithToken extends Invoice {
  items: any;
}

interface PublicInvoiceResponse {
  invoice: InvoiceWithToken;
  clientInfo: any;
  leadInfo: any;
  systemConfig: SystemConfig;
}

export default function PublicInvoiceView() {
  const [match, params] = useRoute("/invoice/:invoiceNumber/:token");
  const [, setLocation] = useLocation();

  const { data: response, isLoading, error } = useQuery<PublicInvoiceResponse>({
    queryKey: ["/api/public/invoice", params?.invoiceNumber, params?.token],
    enabled: !!params?.token && !!params?.invoiceNumber && !!match,
  });

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const invoice = response?.invoice;
  const systemConfig = response?.systemConfig;
  const clientInfo = response?.clientInfo;
  const leadInfo = response?.leadInfo;

  // Check if current user owns this invoice
  const isOwner = currentUser && (
    (clientInfo && clientInfo.userId === currentUser.id) ||
    (leadInfo && leadInfo.userId === currentUser.id)
  );

  if (!match || !params?.token || !params?.invoiceNumber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Invalid Link</h2>
              <p className="text-muted-foreground">
                The invoice link appears to be invalid. Please check your link or contact us for assistance.
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

  if (error || !invoice) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold" data-testid="text-error-title">
                {is404 ? "Invoice Not Found" : "Error Loading Invoice"}
              </h2>
              <p className="text-muted-foreground" data-testid="text-error-message">
                {is404 
                  ? "This invoice link may have expired or is no longer available. Please contact us for assistance."
                  : "We encountered an error loading this invoice. Please try again or contact us for assistance."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyName = systemConfig?.companyName || "FibreUS";
  const companyPhone = systemConfig?.phoneNumber || "";
  const companyEmail = systemConfig?.contactEmail || "";

  const renderActions = () => {
    const balanceDue = parseFloat(invoice.balanceDue || "0");
    
    // If invoice is fully paid
    if (invoice.paymentStatus === 'paid' || balanceDue <= 0) {
      return (
        <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 rounded">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Payment Received</p>
              <p className="text-sm mt-1">
                This invoice has been paid in full. Thank you for your business!
              </p>
            </div>
          </div>
        </div>
      );
    }

    // If invoice is partially paid
    if (invoice.paymentStatus === 'partial') {
      return (
        <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4 rounded space-y-3">
          <div className="flex items-start gap-3 text-orange-700 dark:text-orange-400">
            <Clock className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Partial Payment Received</p>
              <p className="text-sm mt-1">
                Amount Paid: {formatCurrency(parseFloat(invoice.amountPaid || "0"))}
              </p>
              <p className="text-sm font-medium mt-2">
                Balance Due: {formatCurrency(balanceDue)}
              </p>
              <p className="text-xs mt-2">
                {invoice.dueDate && `Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <p className="text-sm">
            Please contact us to arrange payment for the remaining balance.
          </p>
        </div>
      );
    }

    // If invoice is unpaid or overdue
    const isDue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
    return (
      <div className={`border-l-4 ${isDue ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'} p-4 rounded space-y-3`}>
        <div className={`flex items-start gap-3 ${isDue ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
          <DollarSign className="h-5 w-5 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">
              {isDue ? 'Payment Overdue' : 'Payment Pending'}
            </p>
            <p className="text-sm font-medium mt-2">
              Amount Due: {formatCurrency(balanceDue)}
            </p>
            {invoice.dueDate && (
              <p className="text-xs mt-2">
                {isDue ? 'Was due' : 'Due'}: {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm">
          Please contact us to arrange payment or if you have any questions about this invoice.
        </p>
      </div>
    );
  };

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
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold" data-testid="text-invoice-title">Invoice</h2>
          </div>
          <p className="text-muted-foreground">
            Invoice details and payment information
          </p>
        </div>

        <InvoicePreview
          items={Array.isArray(invoice.items) ? invoice.items : []}
          subtotal={invoice.subtotal || "0"}
          taxRate={invoice.taxRate || "0"}
          taxAmount={invoice.taxAmount || "0"}
          total={invoice.total || "0"}
          amountPaid={invoice.amountPaid || "0"}
          balanceDue={invoice.balanceDue || "0"}
          paymentStatus={invoice.paymentStatus}
          dueDate={invoice.dueDate ? new Date(invoice.dueDate).toISOString() : undefined}
          notes={invoice.notes || undefined}
          leadId={invoice.leadId || undefined}
          clientId={invoice.clientId || undefined}
          invoiceNumber={invoice.invoiceNumber}
          renderActions={renderActions}
        />

        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                If you have any questions about this invoice, please contact us.
              </p>
              <p className="text-xs">
                Thank you for your business!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
