import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Bell, Lock, Radio, Cloud, Monitor, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function Services() {
  const services = [
    {
      icon: Camera,
      title: "CCTV Installation",
      description: "State-of-the-art surveillance systems with 4K cameras, night vision, and remote viewing capabilities for comprehensive property protection.",
      url: "/services/cctv-installation",
      features: ["4K Ultra HD", "Night Vision", "Remote Access", "Motion Detection"]
    },
    {
      icon: Bell,
      title: "Alarm Systems",
      description: "Advanced intrusion detection with 24/7 monitoring, instant alerts, and professional response to keep your property secure.",
      url: "/services/alarm-systems",
      features: ["24/7 Monitoring", "Instant Alerts", "Motion Sensors", "Mobile Control"]
    },
    {
      icon: Lock,
      title: "Access Control",
      description: "Smart entry management with biometric scanners, key cards, and mobile credentials for complete access security.",
      url: "/services/access-control",
      features: ["Biometric Access", "Key Card Systems", "Mobile Credentials", "Audit Trails"]
    },
    {
      icon: Radio,
      title: "Intercom Systems",
      description: "Video intercom solutions for residential and commercial properties with HD video, two-way audio, and mobile integration.",
      url: "/services/intercom-systems",
      features: ["Video Intercom", "Two-Way Audio", "Mobile App", "Multi-Unit Support"]
    },
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Secure cloud-based storage for your surveillance footage with automatic backups and remote access from anywhere.",
      url: "/services/cloud-storage",
      features: ["Automatic Backup", "Remote Access", "Encrypted Storage", "Unlimited Retention"]
    },
    {
      icon: Monitor,
      title: "Remote Monitoring",
      description: "Professional monitoring services with real-time alerts, live viewing, and expert response teams available 24/7.",
      url: "/services/remote-monitoring",
      features: ["24/7 Monitoring", "Live Viewing", "Expert Response", "Real-Time Alerts"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4" data-testid="badge-services-page">
              Our Services
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-page-title">
              Complete Security Solutions for Your Property
            </h1>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-page-description">
              Professional electronic security and fiber optic services serving the DMV area. 
              From CCTV installation to cloud storage, we provide enterprise-grade solutions 
              for residential and commercial properties.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote-hero">
                  Get Free Quote
                </Button>
              </GetQuoteDialog>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.title} className="hover-elevate" data-testid={`card-service-${service.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <div className="mb-4">
                    <service.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{service.description}</p>
                  
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant="outline" className="w-full gap-2" asChild data-testid={`button-learn-more-${service.title.toLowerCase().replace(/\s/g, '-')}`}>
                    <Link href={service.url}>
                      Learn More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Secure Your Property?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Our security experts are ready to design a custom solution tailored to your specific needs. 
              Get a free consultation and quote today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button size="lg" variant="secondary" data-testid="button-get-quote-cta">
                  Request Free Quote
                </Button>
              </GetQuoteDialog>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild data-testid="button-contact-us">
                <Link href="/get-appointment">Schedule Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Choose FibreUS?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Badge className="text-2xl font-bold">15+</Badge>
                </div>
                <h3 className="font-semibold mb-2">Years Experience</h3>
                <p className="text-sm text-muted-foreground">Serving the DMV area since 2008</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Badge className="text-2xl font-bold">24/7</Badge>
                </div>
                <h3 className="font-semibold mb-2">Emergency Service</h3>
                <p className="text-sm text-muted-foreground">Round-the-clock support available</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Badge className="text-2xl font-bold">100%</Badge>
                </div>
                <h3 className="font-semibold mb-2">Licensed & Insured</h3>
                <p className="text-sm text-muted-foreground">Fully certified security contractor</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
