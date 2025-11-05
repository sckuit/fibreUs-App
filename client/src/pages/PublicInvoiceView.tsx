import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicePreview } from "@/components/InvoicePreview";
import { AlertCircle, FileText, Phone, Mail } from "lucide-react";
import type { Invoice, SystemConfig } from "@shared/schema";

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

  const { data: response, isLoading, error } = useQuery<PublicInvoiceResponse>({
    queryKey: ["/api/public/invoice", params?.invoiceNumber, params?.token],
    enabled: !!params?.token && !!params?.invoiceNumber && !!match,
  });

  const invoice = response?.invoice;
  const systemConfig = response?.systemConfig;

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
