import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SystemConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    propertyType: "",
    message: ""
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quote request submitted:", formData);
    setIsSubmitted(true);
    // Reset form after 3 seconds for demo
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        propertyType: "",
        message: ""
      });
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      details: [
        config?.phoneNumber || "(555) 123-4567",
        config?.emergencyPhone ? `Emergency: ${config.emergencyPhone}` : "Emergency: (555) 911-HELP"
      ]
    },
    {
      icon: Mail,
      title: "Email Us", 
      details: [
        config?.contactEmail || "info@fibreus.co",
        config?.infoEmail || "support@fibreus.co"
      ]
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: config?.address ? [config.address.split(',')[0], config.address.split(',').slice(1).join(',').trim()] : ["123 Security Blvd", "Washington, DC 20001"]
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Contact Us
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Your Free Security Assessment
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to secure your property? Contact our experts for a complimentary 
            consultation and customized quote.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Your Free Quote</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll contact you within 24 hours to schedule 
                  your free security assessment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                    <p className="text-muted-foreground">
                      Your quote request has been submitted. We'll contact you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="John Smith"
                          required
                          data-testid="input-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="john@example.com"
                          required
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="(555) 123-4567"
                          required
                          data-testid="input-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="propertyType">Property Type</Label>
                        <Select value={formData.propertyType} onValueChange={(value) => handleInputChange("propertyType", value)}>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="government">Government</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="service">Service Interest</Label>
                      <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder="Select service you're interested in" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cctv">CCTV Surveillance</SelectItem>
                          <SelectItem value="alarm">Alarm Systems</SelectItem>
                          <SelectItem value="access">Access Control</SelectItem>
                          <SelectItem value="intercom">Intercom Systems</SelectItem>
                          <SelectItem value="cloud">Cloud Storage</SelectItem>
                          <SelectItem value="monitoring">Remote Monitoring</SelectItem>
                          <SelectItem value="maintenance">Maintenance/Repair</SelectItem>
                          <SelectItem value="upgrade">System Upgrade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">Project Details</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="Tell us about your security needs, current setup, or any specific requirements..."
                        rows={4}
                        data-testid="textarea-message"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" data-testid="button-submit-quote">
                      Get Free Quote
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <Card key={info.title} className="hover-elevate" data-testid={`card-contact-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-md">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{info.title}</h3>
                        {info.details.map((detail) => (
                          <p key={detail} className="text-sm text-muted-foreground mb-1">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}