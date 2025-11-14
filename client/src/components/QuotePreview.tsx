import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SystemConfig, LegalDocuments, Lead, Client } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";

interface ServiceType {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
}

interface QuoteItem {
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
  promoEnabled?: boolean;      // Optional: for promotional quotes
  promoPercent?: number;        // Optional: discount percentage
  originalTotal?: number;       // Optional: total before discount
}

interface QuotePreviewProps {
  items: QuoteItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  validUntil?: string;
  notes?: string;
  leadId?: string;
  clientId?: string;
  quoteNumber?: string;
  renderActions?: () => React.ReactNode;
}

export const QuotePreview = forwardRef<HTMLDivElement, QuotePreviewProps>(({
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  validUntil,
  notes,
  leadId,
  clientId,
  quoteNumber,
  renderActions,
}, ref) => {
  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const { data: legalDocs } = useQuery<LegalDocuments>({
    queryKey: ['/api/legal-documents'],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['/api/service-types'],
  });

  const selectedLead = leadId ? leads.find(l => l.id === leadId) : null;
  const selectedClient = clientId ? clients.find(c => c.id === clientId) : null;
  const customer = selectedClient || selectedLead;

  const companyName = systemConfig?.companyName || 'FibreUS';
  const headerTagline = systemConfig?.headerTagline || 'Electronic Security & Tech Services';
  const companyPhone = systemConfig?.phoneNumber || '';
  const companyEmail = systemConfig?.contactEmail || '';
  const companyWebsite = systemConfig?.website || '';
  const companyAddress = systemConfig?.address || '';
  const darkLogoUrl = systemConfig?.darkLogoUrl || '';

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const validUntilDate = validUntil ? new Date(validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  
  // Check if any items have promotional pricing enabled
  const hasPromoItems = items.some(item => item.promoEnabled);

  return (
    <Card className="mt-6" ref={ref}>
      {/* Professional Header - Blue on Print */}
      <div className="p-6 bg-muted/30 print:bg-primary print:text-primary-foreground print-blue-section">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {darkLogoUrl && (
              <img src={darkLogoUrl} alt={companyName} className="h-16 w-auto object-contain" />
            )}
            <div className="pt-1">
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="text-sm mt-1 opacity-90">{headerTagline}</p>
            </div>
          </div>
          <div className="text-right text-sm space-y-0.5">
            {companyPhone && <div>{companyPhone}</div>}
            {companyEmail && <div>{companyEmail}</div>}
            {companyWebsite && <div>{companyWebsite}</div>}
            {companyAddress && <div className="text-xs mt-2">{companyAddress}</div>}
          </div>
        </div>
      </div>

      <CardContent className="py-6 px-[10%] space-y-6">
        {/* Quote Metadata Section */}
        <div className="flex justify-between items-start pb-4 border-b">
          <div>
            <div className="text-sm"><span className="font-semibold">Quote #:</span> {quoteNumber || 'DRAFT'}</div>
          </div>
          <div className="text-right text-sm space-y-1">
            <div><span className="font-semibold">Date:</span> {currentDate}</div>
            {validUntilDate && <div><span className="font-semibold">Valid Until:</span> {validUntilDate}</div>}
          </div>
        </div>

        {/* Bill To Section */}
        {customer && (
          <div>
            <h3 className="font-bold text-sm mb-2">Bill To:</h3>
            <div className="space-y-0.5 text-sm">
              <div className="font-medium">{customer.name}</div>
              {(customer as any).company && <div>{(customer as any).company}</div>}
              {customer.email && <div>{customer.email}</div>}
              {customer.phone && <div>{customer.phone}</div>}
              {customer.address && <div className="text-muted-foreground">{customer.address}</div>}
            </div>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="font-semibold mb-4">ITEMS</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Item</th>
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Unit Price</th>
                  <th className="text-center py-2 font-semibold">Qty</th>
                  {hasPromoItems && <th className="text-right py-2 font-semibold">Discount</th>}
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={hasPromoItems ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 align-top">
                        {item.itemName}
                        {item.promoEnabled && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">PROMO</span>
                        )}
                      </td>
                      <td className="py-3 align-top text-muted-foreground">
                        {item.description}
                        <span className="text-xs block mt-1">Unit: {item.unit}</span>
                      </td>
                      <td className="py-3 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-center align-top">{item.quantity}</td>
                      {hasPromoItems && (
                        <td className="py-3 text-right align-top">
                          {item.promoEnabled && item.promoPercent ? (
                            <span className="text-green-600 font-medium">{item.promoPercent}% OFF</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 text-right align-top font-medium">
                        {item.promoEnabled && item.originalTotal ? (
                          <div className="space-y-1">
                            <div className="text-muted-foreground line-through text-sm">
                              {formatCurrency(item.originalTotal)}
                            </div>
                            <div className="text-green-600 font-bold">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        ) : (
                          formatCurrency(item.total)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({parseFloat(taxRate || '0').toFixed(1)}%):</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">NOTES</h3>
              <p className="text-sm whitespace-pre-wrap">{notes}</p>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <h3 className="font-semibold">ACCEPTANCE</h3>
          {renderActions ? (
            <div className="py-2">
              {renderActions()}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="border-b border-foreground/20 pb-1 mb-1">
                    <div className="h-12"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Customer Signature</p>
                </div>
                <div>
                  <div className="border-b border-foreground/20 pb-1 mb-1">
                    <div className="h-12"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Date</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                By signing above, you accept this quote and authorize {companyName} to proceed with the work as outlined.
              </p>
            </>
          )}
        </div>

        {legalDocs?.termsOfService && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold">TERMS OF SERVICE</h3>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                {legalDocs.termsOfService}
              </div>
            </div>
          </>
        )}

        {legalDocs?.termsAndConditions && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold">TERMS AND CONDITIONS</h3>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                {legalDocs.termsAndConditions}
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Services Section - Blue on Print */}
      {serviceTypes.filter(s => s.isActive).length > 0 && (
        <div className="p-4 rounded-b-lg bg-muted/30 print:bg-primary print:text-primary-foreground print-blue-section">
          <h3 className="font-semibold text-sm mb-3">OUR SERVICES</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {serviceTypes
              .filter(service => service.isActive)
              .map(service => (
                <div key={service.id}>
                  <h4 className="font-medium text-xs">{service.displayName}</h4>
                  {service.description && (
                    <p className="text-xs opacity-90">{service.description}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
});

QuotePreview.displayName = 'QuotePreview';
