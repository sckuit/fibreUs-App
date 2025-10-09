import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { type Lead } from "@shared/schema";
import { FlyerTemplate } from "./FlyerTemplate";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const serviceOptions = [
  { value: "cctv", label: "CCTV Surveillance Systems" },
  { value: "alarm", label: "Alarm Systems" },
  { value: "access_control", label: "Access Control Systems" },
  { value: "intercom", label: "Intercom Systems" },
  { value: "cloud_storage", label: "Cloud Storage Solutions" },
  { value: "monitoring", label: "24/7 Monitoring Services" },
  { value: "fiber_installation", label: "Fiber Optic Installation" },
  { value: "maintenance", label: "Maintenance & Support" }
];

export default function FlyerBuilder() {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const selectedLead = leads.find(lead => lead.id === selectedLeadId);

  const handleServiceToggle = (serviceValue: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
  };

  const handleDownloadPDF = async () => {
    if (!flyerRef.current || !selectedLead) return;

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
      pdf.save(`FibreUS-Flyer-${selectedLead.name.replace(/\s+/g, '-')}.pdf`);

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
    if (!flyerRef.current || !selectedLead) return;

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
          link.download = `FibreUS-Flyer-${selectedLead.name.replace(/\s+/g, '-')}.png`;
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

  return (
    <div className="space-y-6">
      {/* Hidden flyer for PDF/PNG generation (not scaled) */}
      {selectedLead && selectedServices.length > 0 && (
        <div className="fixed -left-[9999px] top-0">
          <FlyerTemplate
            ref={flyerRef}
            lead={selectedLead}
            selectedServices={selectedServices}
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
                Select a lead and services to generate a professional proposal flyer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lead Selection */}
              <div className="space-y-2">
                <Label>Select Lead</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger data-testid="select-lead-flyer">
                    <SelectValue placeholder="Choose a lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
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

              {/* Services Selection */}
              <div className="space-y-3">
                <Label>Select Services to Propose</Label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {serviceOptions.map((service) => (
                    <div key={service.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.value}
                        checked={selectedServices.includes(service.value)}
                        onCheckedChange={() => handleServiceToggle(service.value)}
                        data-testid={`checkbox-service-${service.value}`}
                      />
                      <Label
                        htmlFor={service.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!selectedLead || selectedServices.length === 0 || isGenerating}
                  className="flex-1"
                  data-testid="button-download-pdf"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Download PDF"}
                </Button>
                <Button
                  onClick={handleDownloadPNG}
                  disabled={!selectedLead || selectedServices.length === 0 || isGenerating}
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
              {!selectedLead ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Select a lead to see preview</p>
                </div>
              ) : selectedServices.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Select at least one service to see preview</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[800px] border rounded-lg">
                  <div className="scale-75 origin-top-left">
                    <FlyerTemplate
                      lead={selectedLead}
                      selectedServices={selectedServices}
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
