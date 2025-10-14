import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Flame, Shield, Smartphone, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import alarmImage from "@assets/generated_images/Alarm_system_panel_1ccf7e52.png";

export default function AlarmSystems() {
  const features = [
    { icon: Bell, title: "Intrusion Detection", description: "Advanced sensors for doors, windows, and motion" },
    { icon: Flame, title: "Fire Protection", description: "Smoke and heat detectors with instant alerts" },
    { icon: Shield, title: "24/7 Monitoring", description: "Professional monitoring center response" },
    { icon: Smartphone, title: "Mobile Alerts", description: "Instant notifications to your smartphone" },
  ];

  const systems = [
    { name: "Home Security", price: "Starting at $899", features: ["Door/Window Sensors", "Motion Detectors", "Control Panel", "Mobile App", "Siren"] },
    { name: "Business Security", price: "Starting at $1,899", features: ["Advanced Sensors", "Fire Detection", "Access Integration", "24/7 Monitoring", "Multiple Zones"] },
    { name: "Enterprise Security", price: "Custom Quote", features: ["Multi-Site Management", "Advanced Analytics", "Integration Suite", "Dedicated Support", "Custom Protocols"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-service-category">Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Comprehensive Alarm Systems</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Advanced alarm systems for intrusion detection and fire protection. Professional monitoring and instant mobile alerts keep you protected 24/7.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <img src={alarmImage} alt="Alarm System" className="rounded-lg shadow-lg" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Complete Protection System</h2>
              <p className="text-muted-foreground mb-6">
                Our alarm systems combine intrusion detection with fire protection, environmental 
                monitoring, and emergency response. Each system is customized to your property's 
                unique layout and security requirements.
              </p>
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Free Assessment
                </Button>
              </GetQuoteDialog>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Protection Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature) => (
              <Card key={feature.title} data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Alarm System Packages</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {systems.map((system) => (
              <Card key={system.name} data-testid={`card-package-${system.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{system.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{system.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {system.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-quote-${system.name.toLowerCase().replace(/\s/g, '-')}`}>
                      Request Quote
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Professional Installation & Monitoring</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Our certified technicians will install and configure your alarm system for optimal protection.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-schedule-installation">
                  Schedule Installation
                </Button>
              </GetQuoteDialog>
              <Link href="/login">
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-client-portal">
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
