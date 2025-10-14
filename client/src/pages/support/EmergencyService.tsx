import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, AlertTriangle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

type SystemConfig = {
  emergencyPhone?: string;
  emergencyEmail?: string;
  phoneNumber?: string;
  contactEmail?: string;
};

export default function EmergencyService() {
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const emergencyPhone = config?.emergencyPhone || "(555) 911-4357";
  const emergencyEmail = config?.emergencyEmail || "emergency@fibreus.com";

  const emergencySteps = [
    { step: 1, title: "Call Emergency Line", description: "Contact our 24/7 emergency hotline immediately" },
    { step: 2, title: "Provide Location", description: "Give us your location and describe the situation" },
    { step: 3, title: "Follow Instructions", description: "Our operator will guide you through next steps" },
    { step: 4, title: "Technician Dispatch", description: "Emergency technician dispatched to your location" },
  ];

  const emergencyTypes = [
    { icon: AlertTriangle, title: "System Failure", description: "Complete security system malfunction or failure", response: "< 30 minutes" },
    { icon: Shield, title: "Security Breach", description: "Unauthorized access or break-in detected", response: "Immediate" },
    { icon: AlertTriangle, title: "Fire Alarm", description: "Fire detection system triggered", response: "Immediate" },
    { icon: Clock, title: "Critical Alert", description: "Any urgent security-related issue", response: "< 1 hour" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-destructive/10">
        <div className="container mx-auto px-4">
          <Badge variant="destructive" className="mb-4" data-testid="badge-emergency">Emergency Support</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-destructive" data-testid="text-page-title">24/7 Emergency Service</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Immediate response for critical security situations. Our emergency team is standing by 24/7/365.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-destructive text-destructive-foreground rounded-lg p-8 mb-16">
            <div className="flex items-center gap-4 mb-6">
              <Phone className="h-12 w-12" />
              <div>
                <h2 className="text-3xl font-bold">Emergency Hotline</h2>
                <p className="text-lg">Available 24 hours a day, 7 days a week</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <a href={`tel:${emergencyPhone.replace(/\D/g, '')}`} className="block">
                <Card className="hover-elevate" data-testid="card-emergency-phone">
                  <CardContent className="p-6">
                    <Phone className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Call Now</p>
                    <p className="text-2xl font-bold" data-testid="text-emergency-phone">{emergencyPhone}</p>
                  </CardContent>
                </Card>
              </a>
              <a href={`mailto:${emergencyEmail}`} className="block">
                <Card className="hover-elevate" data-testid="card-emergency-email">
                  <CardContent className="p-6">
                    <AlertTriangle className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Email Emergency</p>
                    <p className="text-xl font-bold" data-testid="text-emergency-email">{emergencyEmail}</p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">What Qualifies as an Emergency?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {emergencyTypes.map((type) => (
              <Card key={type.title} data-testid={`card-emergency-${type.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <type.icon className="h-12 w-12 text-destructive mb-4" />
                  <CardTitle>{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{type.description}</p>
                  <Badge variant="destructive">Response: {type.response}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Emergency Response Process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {emergencySteps.map((item) => (
              <Card key={item.step} data-testid={`card-step-${item.step}`}>
                <CardHeader>
                  <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Important Emergency Information</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">Before Calling</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Ensure you and others are safe</li>
                  <li>• Have your system details ready if possible</li>
                  <li>• Note any error codes or messages</li>
                  <li>• Know your exact location</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What to Expect</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Immediate call answer (&lt; 30 seconds)</li>
                  <li>• Professional emergency operator</li>
                  <li>• Technician dispatch when needed</li>
                  <li>• Follow-up and resolution confirmation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
