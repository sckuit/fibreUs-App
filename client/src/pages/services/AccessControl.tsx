import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Fingerprint, Smartphone, UserCheck, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import accessImage from "@assets/generated_images/Access_control_system_146c8a85.png";

export default function AccessControl() {
  const features = [
    { icon: KeyRound, title: "Key Cards", description: "Programmable access cards with custom permissions" },
    { icon: Fingerprint, title: "Biometric Access", description: "Fingerprint and facial recognition systems" },
    { icon: Smartphone, title: "Mobile Credentials", description: "Smartphone-based access control" },
    { icon: UserCheck, title: "Visitor Management", description: "Track and control guest access" },
  ];

  const systems = [
    { name: "Office Access", price: "Starting at $1,499", features: ["Key Card System", "2 Card Readers", "Management Software", "100 Cards Included", "Audit Logs"] },
    { name: "Multi-Zone Control", price: "Starting at $3,499", features: ["5 Card Readers", "Biometric Option", "Time-Based Access", "Mobile App", "Integration Ready"] },
    { name: "Enterprise Solution", price: "Custom Quote", features: ["Unlimited Readers", "Multi-Site Management", "Advanced Analytics", "Full Integration", "24/7 Support"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-service-category">Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Modern Access Control Systems</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Secure your facility with advanced access control solutions featuring key cards, biometrics, and mobile credentials. Control who enters and when.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Next-Generation Access Control</h2>
              <p className="text-muted-foreground mb-6">
                Replace traditional locks with intelligent access control systems. Grant and revoke 
                access remotely, track entry/exit logs, and integrate with existing security infrastructure 
                for complete facility management.
              </p>
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Free Consultation
                </Button>
              </GetQuoteDialog>
            </div>
            <div>
              <img src={accessImage} alt="Access Control System" className="rounded-lg shadow-lg" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Access Control Features</h2>
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

          <h2 className="text-3xl font-bold mb-12 text-center">Access Control Packages</h2>
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
            <h2 className="text-2xl font-bold mb-4">Scalable Access Solutions</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Start small and expand as your needs grow. Our systems integrate seamlessly with your existing infrastructure.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-discuss-requirements">
                  Discuss Requirements
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
