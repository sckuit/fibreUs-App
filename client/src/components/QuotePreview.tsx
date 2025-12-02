import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  SystemConfig,
  LegalDocuments,
  Lead,
  Client,
  Project,
} from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { QRCodeSVG } from "qrcode.react";

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
  promoEnabled?: boolean; // Optional: for promotional quotes
  promoPercent?: number; // Optional: discount percentage
  originalTotal?: number; // Optional: total before discount
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
  projectId?: string;
  quoteNumber?: string;
  quoteId?: string;
  shareToken?: string;
  renderActions?: () => React.ReactNode;
}

export const QuotePreview = forwardRef<HTMLDivElement, QuotePreviewProps>(
  (
    {
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      validUntil,
      notes,
      leadId,
      clientId,
      projectId,
      quoteNumber,
      quoteId,
      shareToken,
      renderActions,
    },
    ref,
  ) => {
    const { data: systemConfig } = useQuery<SystemConfig>({
      queryKey: ["/api/system-config"],
    });

    const { data: legalDocs } = useQuery<LegalDocuments>({
      queryKey: ["/api/legal-documents"],
    });

    const { data: leads = [] } = useQuery<Lead[]>({
      queryKey: ["/api/leads"],
    });

    const { data: clients = [] } = useQuery<Client[]>({
      queryKey: ["/api/clients"],
    });

    const { data: projects = [] } = useQuery<Project[]>({
      queryKey: ["/api/projects"],
    });

    const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
      queryKey: ["/api/service-types"],
    });

    const selectedLead = leadId ? leads.find((l) => l.id === leadId) : null;
    const selectedClient = clientId
      ? clients.find((c) => c.id === clientId)
      : null;
    const selectedProject = projectId
      ? projects.find((p) => p.id === projectId)
      : null;
    const customer = selectedClient || selectedLead;

    const companyName = systemConfig?.companyName || "FibreUS";
    const headerTagline =
      systemConfig?.headerTagline || "Electronic Security & Tech Services";
    const companyPhone = systemConfig?.phoneNumber || "";
    const companyEmail = systemConfig?.contactEmail || "";
    const companyWebsite = systemConfig?.website || "";
    const companyAddress = systemConfig?.address || "";
    const darkLogoUrl = systemConfig?.darkLogoUrl || "";

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const validUntilDate = validUntil
      ? new Date(validUntil).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    // Check if any items have promotional pricing enabled
    const hasPromoItems = items.some((item) => item.promoEnabled);

    return (
      <Card className="print:bg-white" ref={ref}>
        {/* Professional Header - Blue on Print */}
        <div className="p-6 bg-muted/30 print:bg-primary print:text-primary-foreground print-blue-section">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {darkLogoUrl && (
                <img
                  src={darkLogoUrl}
                  alt={companyName}
                  className="h-16 w-auto object-contain"
                />
              )}
              <div className="pt-1">
                <h1 className="text-2xl font-bold">{companyName}</h1>
                <p className="text-sm mt-1 opacity-90">{headerTagline}</p>
              </div>
            </div>
            <div className="text-right text-sm space-y-0.5">
              {companyPhone && <div>{companyPhone}</div>}
              {companyEmail && <div>{companyEmail}</div>}
              {companyAddress && (
                <div className="text-xs mt-2">{companyAddress}</div>
              )}
            </div>
          </div>
        </div>
        <CardContent className="py-6 px-[10%] space-y-6 pt-[8px] pb-[8px]">
          {/* Quote Metadata Section */}
          <div className="flex justify-between items-start border-b pt-[2px] pb-[2px]">
            <div>
              <div className="text-sm">
                <span className="font-semibold">Quote #:</span>{" "}
                {quoteNumber || "DRAFT"}
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <div>
                <span className="font-semibold">Date:</span> {currentDate}
              </div>
              {validUntilDate && (
                <div>
                  <span className="font-semibold">Valid Until:</span>{" "}
                  {validUntilDate}
                </div>
              )}
            </div>
          </div>

          {/* Bill To Section */}
          {customer && (
            <div className="mt-[4px] mb-[4px]">
              <h3 className="font-bold text-sm mb-2">Bill To:</h3>
              <div className="space-y-0.5 text-sm">
                <div className="font-medium">
                  {customer.name}
                  {customer.company && ` | ${customer.company}`}
                </div>
                {(customer.email || customer.phone) && (
                  <div>
                    {customer.email &&
                      customer.phone &&
                      `${customer.email} | ${customer.phone}`}
                    {customer.email && !customer.phone && customer.email}
                    {!customer.email && customer.phone && customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="text-muted-foreground">
                    {customer.address}
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="mt-[8px] mb-[8px]" />

          <div>
            {selectedProject && (
              <div className="mb-2 text-sm text-center">
                <span className="font-semibold">Project:</span>{" "}
                {selectedProject.projectName}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-center py-2 font-semibold">Qty</th>
                    <th className="text-left py-2 font-semibold">Item</th>
                    <th className="text-left py-2 font-semibold">
                      Description
                    </th>
                    <th className="text-right py-2 font-semibold">
                      Unit Price
                    </th>
                    {hasPromoItems && (
                      <th className="text-right py-2 font-semibold">
                        Discount
                      </th>
                    )}
                    <th className="text-right py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={hasPromoItems ? 6 : 5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 text-center align-top text-[12px]">
                          {item.quantity}
                        </td>
                        <td className="py-3 align-top text-[12px] pt-[8px] pb-[8px]">
                          {item.itemName}
                          {item.promoEnabled && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              PROMO
                            </span>
                          )}
                        </td>
                        <td className="py-3 align-top text-muted-foreground text-[12px] pt-[8px] pb-[8px]">
                          {item.description}
                        </td>
                        <td className="py-3 text-right align-top text-[12px]">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        {hasPromoItems && (
                          <td className="py-3 text-right align-top text-[12px]">
                            {item.promoEnabled && item.promoPercent ? (
                              <span className="text-green-600 font-medium">
                                {item.promoPercent}% OFF
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        )}
                        <td className="py-3 text-right align-top font-medium text-[12px]">
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

          <div className="flex justify-end print:break-inside-avoid mt-[2px] mb-[2px]">
            <div className="w-full max-w-sm space-y-2 print:break-inside-avoid text-[13px]">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({parseFloat(taxRate || "0").toFixed(1)}%):
                </span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-[14px]">
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

          <Separator className="mt-[4px] mb-[4px]" />

          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 print:break-inside-avoid pt-[4px] pb-[4px] mt-[4px] mb-[4px] pl-[8px] pr-[8px]">
            <h3 className="font-semibold">APPROVAL</h3>
            {renderActions ? (
              <div className="py-2">{renderActions()}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="border-b border-foreground/20 pb-1 mb-1">
                      <div className="h-12"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer Signature
                    </p>
                  </div>
                  <div>
                    <div className="border-b border-foreground/20 pb-1 mb-1">
                      <div className="h-12"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Date</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  By signing above, you accept this quote and authorize{" "}
                  {companyName} to proceed with the work as outlined.
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
        {/* QR Codes Section */}
        {(companyPhone || companyWebsite || shareToken) && (
          <div className="px-6 py-4 border-t print:break-inside-avoid">
            <div className="flex items-center justify-evenly">
              {companyPhone && (
                <div className="flex flex-col items-center gap-2">
                  <QRCodeSVG
                    value={`tel:${companyPhone}`}
                    size={80}
                    level="M"
                  />
                  <p className="text-xs text-muted-foreground">Call Us</p>
                </div>
              )}
              {companyWebsite && (
                <div className="flex flex-col items-center gap-2">
                  <QRCodeSVG
                    value={
                      companyWebsite.startsWith("http")
                        ? companyWebsite
                        : `https://${companyWebsite}`
                    }
                    size={80}
                    level="M"
                  />
                  <p className="text-xs text-muted-foreground">
                    {companyWebsite}
                  </p>
                </div>
              )}
              {shareToken && typeof window !== "undefined" && (
                <div className="flex flex-col items-center gap-2">
                  <QRCodeSVG
                    value={`${window.location.origin}/public/quote/${shareToken}`}
                    size={80}
                    level="M"
                  />
                  <p className="text-xs text-muted-foreground">View Quote</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Services Section - Blue on Print */}
        {serviceTypes.filter((s) => s.isActive).length > 0 && (
          <div className="p-4 rounded-b-lg bg-muted/30 print:bg-primary print:text-primary-foreground print-blue-section print:break-inside-avoid">
            <h3 className="font-semibold text-sm mb-3">OUR SERVICES</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {serviceTypes
                .filter((service) => service.isActive)
                .map((service) => (
                  <div key={service.id}>
                    <h4 className="font-medium text-xs">
                      {service.displayName}
                    </h4>
                    {service.description && (
                      <p className="text-xs opacity-90">
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>
    );
  },
);

QuotePreview.displayName = "QuotePreview";
