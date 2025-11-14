import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { Invoice } from "@shared/schema";
import { PrintLayout } from "@/components/PrintLayout";
import { InvoicePreview } from "@/components/InvoicePreview";

export default function InvoicePrintPage() {
  const [, params] = useRoute("/print/invoice/:id");
  const invoiceId = params?.id;

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: ['/api/invoices', invoiceId],
    enabled: !!invoiceId,
  });

  if (isLoading) {
    return (
      <PrintLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </PrintLayout>
    );
  }

  if (error || !invoice) {
    return (
      <PrintLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">Failed to load invoice. Please try again.</p>
        </div>
      </PrintLayout>
    );
  }

  const items = invoice.items as any[];

  return (
    <PrintLayout>
      <InvoicePreview
        items={items}
        subtotal={String(invoice.subtotal ?? '0.00')}
        taxRate={String(invoice.taxRate ?? '0.00')}
        taxAmount={String(invoice.taxAmount ?? '0.00')}
        total={String(invoice.total ?? '0.00')}
        amountPaid={invoice.amountPaid ? String(invoice.amountPaid) : undefined}
        balanceDue={invoice.balanceDue ? String(invoice.balanceDue) : undefined}
        paymentStatus={invoice.paymentStatus ?? undefined}
        dueDate={invoice.dueDate ? (invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : invoice.dueDate) : undefined}
        notes={invoice.notes ?? undefined}
        leadId={invoice.leadId ?? undefined}
        clientId={invoice.clientId ?? ''}
        invoiceNumber={invoice.invoiceNumber ?? undefined}
        quoteId={invoice.quoteId ?? undefined}
      />
    </PrintLayout>
  );
}
