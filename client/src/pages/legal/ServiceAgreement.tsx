import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function ServiceAgreement() {
  const slaComponents = [
    { icon: Clock, title: "Response Times", description: "Guaranteed response times for support and service calls" },
    { icon: Shield, title: "Uptime Guarantee", description: "99.9% uptime for monitoring and cloud services" },
    { icon: FileText, title: "Service Credits", description: "Credits issued for service level breaches" },
    { icon: CheckCircle, title: "Performance Metrics", description: "Detailed reporting on service performance" },
  ];

  const agreementTypes = [
    {
      name: "Standard Service Agreement",
      features: [
        "Annual system inspection",
        "Software updates included",
        "Business hours support (8AM-6PM)",
        "48-hour response time",
        "Basic performance reporting"
      ]
    },
    {
      name: "Premium Service Agreement",
      features: [
        "Quarterly system inspections",
        "Priority software updates",
        "Extended support (7AM-9PM)",
        "24-hour response time",
        "Advanced analytics and reporting",
        "10% discount on additional services"
      ]
    },
    {
      name: "Enterprise Service Agreement",
      features: [
        "Monthly system inspections",
        "Immediate software updates",
        "24/7 dedicated support",
        "2-hour response time",
        "Real-time monitoring and alerts",
        "Custom SLA terms",
        "Dedicated account manager"
      ]
    },
  ];

  const contractTerms = [
    {
      title: "Installation & Setup",
      content: "Professional installation by certified technicians, system configuration and testing, user training, documentation delivery, and 30-day warranty on installation workmanship."
    },
    {
      title: "Monitoring Services",
      content: "24/7 professional monitoring, instant alert notifications, emergency response coordination, regular system health checks, and monthly performance reports."
    },
    {
      title: "Maintenance Coverage",
      content: "Regular preventive maintenance, priority service scheduling, discounted repair rates, parts and labor coverage (per agreement), and emergency service availability."
    },
    {
      title: "Term & Renewal",
      content: "Initial contract term as specified, automatic renewal unless canceled 30 days prior, flexible upgrade options, and transparent pricing with no hidden fees."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-legal-category">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Service Level Agreements</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Our commitment to service excellence. Clear expectations and guaranteed performance standards for your security services.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">SLA Components</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {slaComponents.map((component) => (
              <Card key={component.title} data-testid={`card-component-${component.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <component.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{component.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{component.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Service Agreement Types</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {agreementTypes.map((agreement) => (
              <Card key={agreement.name} data-testid={`card-agreement-${agreement.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{agreement.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {agreement.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-select-${agreement.name.toLowerCase().replace(/\s/g, '-')}`}>
                      Select Agreement
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Contract Terms</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-6xl mx-auto">
            {contractTerms.map((term) => (
              <Card key={term.title} data-testid={`card-term-${term.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{term.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{term.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-16 max-w-4xl mx-auto" data-testid="card-customization">
            <CardHeader>
              <CardTitle>Custom Service Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Need a customized service agreement for your organization? We can tailor our SLAs to meet your 
                specific requirements, including custom response times, specialized support hours, dedicated 
                resources, and unique performance metrics.
              </p>
              <GetQuoteDialog>
                <Button data-testid="button-request-custom">Request Custom Agreement</Button>
              </GetQuoteDialog>
            </CardContent>
          </Card>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Choose a service agreement that fits your needs or contact us to create a custom solution.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-get-agreement">
                  Get Service Agreement
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
