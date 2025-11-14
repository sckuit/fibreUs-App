import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { Quote } from "@shared/schema";
import { PrintLayout } from "@/components/PrintLayout";
import { QuotePreview } from "@/components/QuotePreview";

export default function QuotePrintPage() {
  const [, params] = useRoute("/print/quote/:id");
  const quoteId = params?.id;

  const { data: quote, isLoading, error } = useQuery<Quote>({
    queryKey: ['/api/quotes', quoteId],
    enabled: !!quoteId,
  });

  if (isLoading) {
    return (
      <PrintLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading quote...</p>
        </div>
      </PrintLayout>
    );
  }

  if (error || !quote) {
    return (
      <PrintLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">Failed to load quote. Please try again.</p>
        </div>
      </PrintLayout>
    );
  }

  const items = quote.items as any[];

  return (
    <PrintLayout>
      <QuotePreview
        items={items}
        subtotal={quote.subtotal}
        taxRate={quote.taxRate || '0.00'}
        taxAmount={quote.taxAmount || '0.00'}
        total={quote.total}
        validUntil={quote.validUntil ? (quote.validUntil instanceof Date ? quote.validUntil.toISOString().split('T')[0] : quote.validUntil) : undefined}
        notes={quote.notes || undefined}
        leadId={quote.leadId || undefined}
        clientId={quote.clientId || undefined}
        quoteNumber={quote.quoteNumber || undefined}
        quoteId={quoteId}
        shareToken={quote.shareToken || undefined}
      />
    </PrintLayout>
  );
}
