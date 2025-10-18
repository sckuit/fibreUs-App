import { useQuery } from "@tanstack/react-query";
import type { SystemConfig, LegalDocuments, Lead, Client } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

interface QuoteItem {
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
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
}

export function QuotePreview({
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  validUntil,
  notes,
  leadId,
  clientId,
}: QuotePreviewProps) {
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

  const selectedLead = leadId ? leads.find(l => l.id === leadId) : null;
  const selectedClient = clientId ? clients.find(c => c.id === clientId) : null;
  const customer = selectedClient || selectedLead;

  const companyName = systemConfig?.companyName || 'FibreUS';
  const companyPhone = systemConfig?.phoneNumber || '';
  const companyEmail = systemConfig?.contactEmail || '';
  const companyWebsite = systemConfig?.website || '';
  const companyAddress = systemConfig?.address || '';

  return (
    <Card className="mt-6">
      <CardHeader className="bg-primary text-primary-foreground py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="text-sm opacity-90">Professional Quote</p>
            </div>
          </div>
          <div className="text-right text-sm">
            {companyPhone && <div>{companyPhone}</div>}
            {companyEmail && <div>{companyEmail}</div>}
            {companyWebsite && <div>{companyWebsite}</div>}
            {companyAddress && <div className="mt-1">{companyAddress}</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {customer && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">PREPARED FOR</h3>
            <div className="space-y-1">
              <div className="font-medium">{customer.name}</div>
              {customer.email && <div className="text-sm">{customer.email}</div>}
              {customer.phone && <div className="text-sm">{customer.phone}</div>}
              {customer.address && <div className="text-sm text-muted-foreground">{customer.address}</div>}
            </div>
          </div>
        )}

        {validUntil && (
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Valid Until: </span>
            <span className="text-sm">{new Date(validUntil).toLocaleDateString()}</span>
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
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 align-top">{item.itemName}</td>
                      <td className="py-3 align-top text-muted-foreground">
                        {item.description}
                        <span className="text-xs block mt-1">Unit: {item.unit}</span>
                      </td>
                      <td className="py-3 text-right align-top">${parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td className="py-3 text-center align-top">{item.quantity}</td>
                      <td className="py-3 text-right align-top font-medium">${item.total.toFixed(2)}</td>
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
              <span className="font-medium">${parseFloat(subtotal || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({parseFloat(taxRate || '0').toFixed(1)}%):</span>
              <span className="font-medium">${parseFloat(taxAmount || '0').toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${parseFloat(total || '0').toFixed(2)}</span>
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

        <div className="space-y-4">
          <h3 className="font-semibold">ACCEPTANCE</h3>
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
        </div>

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
    </Card>
  );
}
