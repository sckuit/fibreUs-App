import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, HardDrive, Lock, Download, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function CloudStorage() {
  const features = [
    { icon: Cloud, title: "Cloud Backup", description: "Automatic cloud backup of all surveillance footage" },
    { icon: HardDrive, title: "Hybrid Storage", description: "Combine local and cloud storage for reliability" },
    { icon: Lock, title: "Encrypted Storage", description: "Military-grade encryption for your footage" },
    { icon: Download, title: "Easy Access", description: "Download footage anytime from anywhere" },
  ];

  const plans = [
    { name: "Basic Cloud", price: "$29/month", features: ["30 Days Retention", "Up to 4 Cameras", "100GB Storage", "Mobile Access", "Email Alerts"] },
    { name: "Professional Cloud", price: "$79/month", features: ["90 Days Retention", "Up to 16 Cameras", "500GB Storage", "Priority Support", "Advanced Analytics"] },
    { name: "Enterprise Cloud", price: "Custom Quote", features: ["Custom Retention", "Unlimited Cameras", "Unlimited Storage", "Dedicated Support", "SLA Guarantee"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-service-category">Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Cloud Storage Solutions</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Secure cloud-based video storage and backup solutions. Never lose critical footage with redundant, encrypted cloud storage.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Secure Cloud Video Storage</h2>
              <p className="text-muted-foreground mb-6">
                Protect your surveillance footage with enterprise-grade cloud storage. Our solutions 
                provide automatic backup, long-term retention, and instant access to your video archives 
                from any device, anywhere in the world.
              </p>
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Started
                </Button>
              </GetQuoteDialog>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Why Cloud Storage?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <strong>Protection from Theft:</strong> Footage is safely stored off-site
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <strong>Disaster Recovery:</strong> Survive fires, floods, and hardware failures
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <strong>Remote Access:</strong> View and download footage from anywhere
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <strong>Scalable Storage:</strong> Expand capacity as your needs grow
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Cloud Storage Features</h2>
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

          <h2 className="text-3xl font-bold mb-12 text-center">Storage Plans</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <Card key={plan.name} data-testid={`card-plan-${plan.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{plan.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-subscribe-${plan.name.toLowerCase().replace(/\s/g, '-')}`}>
                      Subscribe Now
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Enterprise Storage Solutions</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Need custom retention periods or unlimited storage? Contact us for enterprise cloud solutions.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-contact-sales">
                  Contact Sales
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
