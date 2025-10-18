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

interface InvoiceItem {
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

interface InvoicePreviewProps {
  items: InvoiceItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid?: string;
  balanceDue?: string;
  paymentStatus?: string;
  dueDate?: string;
  notes?: string;
  leadId?: string;
  clientId?: string;
  invoiceNumber?: string;
  quoteId?: string;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  amountPaid = "0",
  balanceDue,
  paymentStatus,
  dueDate,
  notes,
  leadId,
  clientId,
  invoiceNumber,
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
  const dueDateDisplay = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const calculatedBalanceDue = balanceDue || (parseFloat(total || "0") - parseFloat(amountPaid || "0")).toString();

  return (
    <Card className="mt-6" ref={ref}>
      {/* Professional Header - Dark Blue Background */}
      <div className="bg-[#1e3a5f] text-white p-6">
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

      <CardContent className="p-6 space-y-6">
        {/* Invoice Metadata Section */}
        <div className="flex justify-between items-start pb-4 border-b">
          <div>
            <div className="text-sm"><span className="font-semibold">Invoice #:</span> {invoiceNumber || 'DRAFT'}</div>
          </div>
          <div className="text-right text-sm space-y-1">
            <div><span className="font-semibold">Date:</span> {currentDate}</div>
            {dueDateDisplay && <div><span className="font-semibold">Due Date:</span> {dueDateDisplay}</div>}
          </div>
        </div>

        {/* Bill To Section */}
        {customer && (
          <div>
            <h3 className="font-bold text-sm mb-2">Bill To:</h3>
            <div className="space-y-0.5 text-sm">
              <div className="font-medium">{customer.name}</div>
              {customer.email && <div>{customer.email}</div>}
              {customer.phone && <div>{customer.phone}</div>}
              {customer.address && <div>{customer.address}</div>}
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left text-sm">
                <th className="p-3 font-semibold">Item</th>
                <th className="p-3 font-semibold text-center">Unit</th>
                <th className="p-3 font-semibold text-right">Unit Price</th>
                <th className="p-3 font-semibold text-center">Qty</th>
                <th className="p-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">
                    <div className="font-medium text-sm">{item.itemName}</div>
                    {item.description && <div className="text-xs text-muted-foreground mt-1">{item.description}</div>}
                  </td>
                  <td className="p-3 text-center text-sm">{item.unit}</td>
                  <td className="p-3 text-right text-sm">{formatCurrency(parseFloat(item.unitPrice))}</td>
                  <td className="p-3 text-center text-sm">{item.quantity}</td>
                  <td className="p-3 text-right text-sm font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>{formatCurrency(parseFloat(subtotal))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Tax ({taxRate}%):</span>
              <span>{formatCurrency(parseFloat(taxAmount))}</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2 text-base font-bold">
              <span>Total:</span>
              <span>{formatCurrency(parseFloat(total))}</span>
            </div>
            
            {/* Payment Tracking */}
            <Separator className="my-2" />
            <div className="flex justify-between py-1 text-sm">
              <span>Amount Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(parseFloat(amountPaid))}</span>
            </div>
            <div className="flex justify-between py-2 text-base font-bold">
              <span>Balance Due:</span>
              <span className={parseFloat(calculatedBalanceDue) > 0 ? "text-orange-600" : "text-green-600"}>
                {formatCurrency(parseFloat(calculatedBalanceDue))}
              </span>
            </div>
            {paymentStatus && (
              <div className="flex justify-between py-1 text-xs">
                <span>Payment Status:</span>
                <span className={`font-medium uppercase ${
                  paymentStatus === 'paid' ? 'text-green-600' : 
                  paymentStatus === 'partial' ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {paymentStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {notes && (
          <div className="pt-4 border-t">
            <h3 className="font-bold text-sm mb-2">Notes:</h3>
            <p className="text-sm whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {/* Terms & Conditions */}
        {legalDocs?.termsAndConditions && (
          <div className="pt-4 border-t">
            <h3 className="font-bold text-sm mb-2">Terms & Conditions:</h3>
            <div className="text-xs whitespace-pre-wrap text-muted-foreground">
              {legalDocs.termsAndConditions}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="pt-6 grid grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <div className="border-b border-foreground/20 mb-2 h-8"></div>
              <div className="text-xs text-muted-foreground">Authorized Signature</div>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <div className="border-b border-foreground/20 mb-2 h-8"></div>
              <div className="text-xs text-muted-foreground">Date</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Services Footer */}
      <div className="bg-[#1e3a5f] text-white p-4">
        <h3 className="text-xs font-semibold mb-2 text-center">OUR SERVICES</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {serviceTypes.filter(s => s.isActive).map(service => (
            <div key={service.id} className="text-center">
              {service.displayName}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
});

InvoicePreview.displayName = "InvoicePreview";
