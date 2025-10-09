import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { type Lead, type Client, type SystemConfig, type ServiceType, type User } from "@shared/schema";
import { FlyerTemplate } from "./FlyerTemplate";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function FlyerBuilder() {
  const [recipientType, setRecipientType] = useState<"lead" | "client">("lead");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [personalizedMessage, setPersonalizedMessage] = useState<string>("");
  const [showPricing, setShowPricing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ["/api/system-config"],
  });

  const { data: serviceTypes = [], isLoading: servicesLoading } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });

  const selectedLead = leads.find(lead => lead.id === selectedLeadId);
  const selectedClient = clients.find(client => client.id === selectedClientId);
  const selectedRecipient = recipientType === "lead" ? selectedLead : selectedClient;
  
  // Filter users who can be sales contacts (sales, manager, admin roles)
  const salesUsers = users.filter(u => ['sales', 'manager', 'admin'].includes(u.role || ''));
  const selectedSalesPerson = salesUsers.find(u => u.id === selectedSalesPersonId);

  const handleServiceToggle = (serviceValue: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
  };

  const handleDownloadPDF = async () => {
    if (!flyerRef.current || !selectedRecipient) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      const recipientName = selectedRecipient.name || selectedRecipient.company || 'Client';
      pdf.save(`${systemConfig?.companyName || 'FibreUS'}-Flyer-${recipientName.replace(/\s+/g, '-')}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Your flyer has been downloaded as PDF successfully.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!flyerRef.current || !selectedRecipient) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const recipientName = selectedRecipient.name || selectedRecipient.company || 'Client';
          link.download = `${systemConfig?.companyName || 'FibreUS'}-Flyer-${recipientName.replace(/\s+/g, '-')}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          toast({
            title: "PNG Downloaded",
            description: "Your flyer has been downloaded as PNG successfully.",
          });
        }
      });
    } catch (error) {
      console.error('PNG generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PNG. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const activeServiceTypes = serviceTypes.filter(st => st.isActive);

  return (
    <div className="space-y-6">
      {/* Hidden flyer for PDF/PNG generation (not scaled) */}
      {selectedRecipient && selectedServices.length > 0 && (
        <div className="fixed -left-[9999px] top-0">
          <FlyerTemplate
            ref={flyerRef}
            recipient={selectedRecipient}
            selectedServices={selectedServices}
            systemConfig={systemConfig}
            serviceTypes={serviceTypes}
            salesPerson={selectedSalesPerson}
            personalizedMessage={personalizedMessage}
            showPricing={showPricing}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Service Flyer</CardTitle>
              <CardDescription>
                Select a recipient and services to generate a professional proposal flyer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recipient Type Selection */}
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <RadioGroup value={recipientType} onValueChange={(value: "lead" | "client") => {
                  setRecipientType(value);
                  setSelectedLeadId("");
                  setSelectedClientId("");
                }}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lead" id="lead" data-testid="radio-recipient-lead" />
                    <Label htmlFor="lead" className="font-normal cursor-pointer">Lead</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="client" id="client" data-testid="radio-recipient-client" />
                    <Label htmlFor="client" className="font-normal cursor-pointer">Existing Client</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Recipient Selection */}
              {recipientType === "lead" ? (
                <div className="space-y-2">
                  <Label>Select Lead</Label>
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger data-testid="select-lead-flyer">
                      <SelectValue placeholder="Choose a lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leadsLoading ? (
                        <SelectItem value="loading" disabled>Loading leads...</SelectItem>
                      ) : leads.length === 0 ? (
                        <SelectItem value="empty" disabled>No leads available</SelectItem>
                      ) : (
                        leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name} {lead.company ? `(${lead.company})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger data-testid="select-client-flyer">
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsLoading ? (
                        <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                      ) : clients.length === 0 ? (
                        <SelectItem value="empty" disabled>No clients available</SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} {client.company ? `(${client.company})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sales Contact Person Selection */}
              <div className="space-y-2">
                <Label>Sales Contact Person</Label>
                <Select value={selectedSalesPersonId} onValueChange={setSelectedSalesPersonId}>
                  <SelectTrigger data-testid="select-sales-person">
                    <SelectValue placeholder="Choose sales contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="loading" disabled>Loading users...</SelectItem>
                    ) : salesUsers.length === 0 ? (
                      <SelectItem value="empty" disabled>No sales users available</SelectItem>
                    ) : (
                      salesUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Personalized Message */}
              <div className="space-y-2">
                <Label>Personalized Message (Optional)</Label>
                <Textarea
                  value={personalizedMessage}
                  onChange={(e) => setPersonalizedMessage(e.target.value)}
                  placeholder="Dear [Name], We're excited to present..."
                  rows={3}
                  data-testid="textarea-personalized-message"
                />
                <p className="text-xs text-muted-foreground">Add a personal touch to your flyer</p>
              </div>

              {/* Show Pricing Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Include Pricing</Label>
                  <p className="text-xs text-muted-foreground">Display service prices on the flyer</p>
                </div>
                <Switch
                  checked={showPricing}
                  onCheckedChange={setShowPricing}
                  data-testid="switch-show-pricing"
                />
              </div>

              {/* Services Selection */}
              <div className="space-y-3">
                <Label>Select Services to Propose</Label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {servicesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading services...</p>
                  ) : activeServiceTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active services available</p>
                  ) : (
                    activeServiceTypes.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={service.name}
                          checked={selectedServices.includes(service.name)}
                          onCheckedChange={() => handleServiceToggle(service.name)}
                          data-testid={`checkbox-service-${service.name}`}
                        />
                        <Label
                          htmlFor={service.name}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {service.displayName}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!selectedRecipient || selectedServices.length === 0 || isGenerating}
                  className="flex-1"
                  data-testid="button-download-pdf"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Download PDF"}
                </Button>
                <Button
                  onClick={handleDownloadPNG}
                  disabled={!selectedRecipient || selectedServices.length === 0 || isGenerating}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-download-png"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Download PNG"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Flyer Preview</CardTitle>
              <CardDescription>
                Live preview of your service proposal flyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedRecipient ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Select a {recipientType} to see preview</p>
                </div>
              ) : selectedServices.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Select at least one service to see preview</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[800px] border rounded-lg">
                  <div className="scale-75 origin-top-left">
                    <FlyerTemplate
                      recipient={selectedRecipient}
                      selectedServices={selectedServices}
                      systemConfig={systemConfig}
                      serviceTypes={serviceTypes}
                      salesPerson={selectedSalesPerson}
                      personalizedMessage={personalizedMessage}
                      showPricing={showPricing}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
