import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Wrench, Clock, Award } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function WarrantyInformation() {
  const warranties = [
    { icon: Wrench, title: "Installation Warranty", period: "1 Year", description: "Coverage for workmanship and installation quality" },
    { icon: Shield, title: "Equipment Warranty", period: "2-5 Years", description: "Manufacturer warranties on all hardware" },
    { icon: Clock, title: "Parts Warranty", period: "90 Days", description: "Warranty on replacement parts and components" },
    { icon: Award, title: "Extended Warranty", period: "Up to 10 Years", description: "Optional extended coverage available" },
  ];

  const coverageDetails = [
    {
      title: "What's Covered",
      items: [
        "Defects in materials or workmanship",
        "Equipment malfunction under normal use",
        "Installation errors or issues",
        "Firmware and software defects",
        "Cable and wiring problems",
        "Component failures"
      ]
    },
    {
      title: "What's Not Covered",
      items: [
        "Damage from misuse or abuse",
        "Lightning or power surge damage",
        "Unauthorized modifications",
        "Normal wear and tear",
        "Cosmetic damage that doesn't affect function",
        "Acts of nature or disasters"
      ]
    },
  ];

  const warrantyProcess = [
    { step: 1, title: "Report Issue", description: "Contact our support team to report the problem" },
    { step: 2, title: "Diagnostic", description: "We'll diagnose the issue remotely or schedule a visit" },
    { step: 3, title: "Approval", description: "Warranty claim reviewed and approved" },
    { step: 4, title: "Repair/Replace", description: "Equipment repaired or replaced at no charge" },
  ];

  const extendedOptions = [
    {
      name: "Extended Protection",
      price: "$149/year",
      features: ["Extends warranty by 3 years", "Priority service", "Accidental damage coverage", "No deductible"]
    },
    {
      name: "Lifetime Protection",
      price: "$499 one-time",
      features: ["Lifetime equipment coverage", "Free annual inspections", "Parts replacement included", "24/7 priority support"]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-legal-category">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Warranty Information</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Comprehensive warranty coverage for your security equipment and installation. Your investment is protected.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Warranty Coverage</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {warranties.map((warranty) => (
              <Card key={warranty.title} data-testid={`card-warranty-${warranty.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <warranty.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{warranty.title}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{warranty.period}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{warranty.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
            {coverageDetails.map((detail) => (
              <Card key={detail.title} data-testid={`card-coverage-${detail.title.toLowerCase().replace(/'/g, '').replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{detail.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {detail.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className={detail.title === "What's Covered" ? "text-green-500" : "text-destructive"}>
                          {detail.title === "What's Covered" ? "✓" : "✗"}
                        </span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Warranty Claim Process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {warrantyProcess.map((item) => (
              <Card key={item.step} data-testid={`card-process-${item.step}`}>
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

          <h2 className="text-3xl font-bold mb-12 text-center">Extended Warranty Options</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            {extendedOptions.map((option) => (
              <Card key={option.name} data-testid={`card-extended-${option.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{option.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{option.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-purchase-${option.name.toLowerCase().replace(/\s/g, '-')}`}>
                      Purchase Extended Warranty
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-16 max-w-4xl mx-auto" data-testid="card-important-notes">
            <CardHeader>
              <CardTitle>Important Warranty Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Warranty is non-transferable and applies to original purchaser only</li>
                <li>• Regular maintenance is required to maintain warranty validity</li>
                <li>• Keep your proof of purchase and warranty documentation</li>
                <li>• Unauthorized repairs may void warranty coverage</li>
                <li>• Some manufacturer warranties may have different terms</li>
                <li>• Contact us immediately if you experience any issues</li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Warranty Service?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Our warranty team is here to help. File a claim or get more information about your coverage.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-file-claim">
                  File Warranty Claim
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
