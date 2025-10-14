import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Eye, Shield, Monitor, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import cctvImage from "@assets/generated_images/CCTV_installation_service_bd6e4d29.png";

export default function CCTVInstallation() {
  const features = [
    { icon: Camera, title: "4K Ultra HD Cameras", description: "Crystal clear video quality for maximum detail" },
    { icon: Eye, title: "Night Vision", description: "Infrared technology for 24/7 surveillance" },
    { icon: Monitor, title: "Remote Viewing", description: "Access your cameras from anywhere via mobile app" },
    { icon: Shield, title: "Advanced Analytics", description: "Motion detection and intelligent alerts" },
  ];

  const systems = [
    { name: "Basic Package", price: "Starting at $1,299", features: ["4 HD Cameras", "DVR Recording", "Mobile App", "1TB Storage"] },
    { name: "Professional Package", price: "Starting at $2,499", features: ["8 4K Cameras", "NVR Recording", "Mobile App", "2TB Storage", "Night Vision"] },
    { name: "Enterprise Package", price: "Custom Quote", features: ["16+ 4K Cameras", "Enterprise NVR", "Multi-Site Access", "Cloud Backup", "24/7 Monitoring"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-service-category">Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Professional CCTV Installation</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            State-of-the-art surveillance systems with 4K cameras, night vision, and remote viewing capabilities. Protect your property with enterprise-grade security technology.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Advanced Surveillance Technology</h2>
              <p className="text-muted-foreground mb-6">
                Our CCTV systems provide comprehensive coverage with the latest camera technology. 
                From small residential properties to large commercial facilities, we design custom 
                solutions that meet your specific security needs.
              </p>
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Free Quote
                </Button>
              </GetQuoteDialog>
            </div>
            <div>
              <img src={cctvImage} alt="CCTV Installation" className="rounded-lg shadow-lg" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
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

          <h2 className="text-3xl font-bold mb-12 text-center">CCTV Packages</h2>
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
            <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Contact our security experts for a personalized consultation and site assessment.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-contact-expert">
                  Contact Expert
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
