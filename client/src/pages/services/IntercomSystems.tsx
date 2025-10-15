import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Phone, Building2, Home, CheckCircle } from "lucide-react";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";
import intercomImage from "@assets/generated_images/Intercom_system_22f24182.png";

export default function IntercomSystems() {
  const features = [
    { icon: Video, title: "Video Intercom", description: "See who's at the door with HD video quality" },
    { icon: Phone, title: "Two-Way Audio", description: "Crystal clear communication with visitors" },
    { icon: Building2, title: "Multi-Unit Support", description: "Perfect for apartments and office buildings" },
    { icon: Home, title: "Smart Home Integration", description: "Connect with your existing smart home system" },
  ];

  const systems = [
    { name: "Residential", price: "Starting at $699", features: ["Video Intercom", "2-Way Audio", "Mobile App", "Door Release", "Night Vision"] },
    { name: "Multi-Tenant", price: "Starting at $2,499", features: ["10 Units", "Directory System", "Remote Access", "Visitor Log", "Integration Ready"] },
    { name: "Commercial", price: "Custom Quote", features: ["Unlimited Units", "Advanced Features", "Access Integration", "Custom Branding", "24/7 Support"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-service-category">Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Video Intercom Systems</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Professional video intercom solutions for residential and commercial properties. See and speak with visitors before granting access.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <img src={intercomImage} alt="Intercom System" className="rounded-lg shadow-lg" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Smart Intercom Technology</h2>
              <p className="text-muted-foreground mb-6">
                Modern intercom systems provide security and convenience. From single-family homes 
                to large apartment complexes, our solutions offer video communication, remote access 
                control, and seamless integration with your security infrastructure.
              </p>
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Free Quote
                </Button>
              </GetQuoteDialog>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Intercom Features</h2>
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

          <h2 className="text-3xl font-bold mb-12 text-center">Intercom Packages</h2>
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
            <h2 className="text-2xl font-bold mb-4">Enhanced Security & Convenience</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Upgrade your property with a modern intercom system. Perfect for homes, apartments, and commercial buildings.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-schedule-consultation">
                  Schedule Consultation
                </Button>
              </GetQuoteDialog>
              <LoginDialog>
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-client-portal">
                  Client Portal
                </Button>
              </LoginDialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
