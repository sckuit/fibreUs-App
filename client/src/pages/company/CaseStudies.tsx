import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Home, Factory } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function CaseStudies() {
  const caseStudies = [
    {
      icon: Building2,
      title: "Downtown Office Complex",
      category: "Commercial Access Control",
      challenge: "Needed secure access control for a 5-story building with 50+ tenants",
      solution: "Implemented cloud-based access control with mobile credentials, time-based access, and visitor management system",
      results: ["100% reduction in lost key incidents", "Improved tenant satisfaction by 40%", "Reduced security costs by 30%"]
    },
    {
      icon: Store,
      title: "Retail Chain - 12 Locations",
      category: "Multi-Site CCTV & Alarms",
      challenge: "Required centralized monitoring across all locations with real-time alerts",
      solution: "Deployed 4K CCTV systems with cloud storage, integrated alarm systems, and centralized monitoring dashboard",
      results: ["85% reduction in theft incidents", "Faster incident response time", "Complete visibility across all sites"]
    },
    {
      icon: Home,
      title: "Luxury Residential Community",
      category: "Integrated Security System",
      challenge: "High-end community needed comprehensive security without compromising aesthetics",
      solution: "Installed discreet cameras, smart intercom systems, perimeter alarms, and mobile access control",
      results: ["Zero security breaches in 2 years", "Increased property values by 15%", "98% resident satisfaction"]
    },
    {
      icon: Factory,
      title: "Manufacturing Facility",
      category: "Industrial Security & Fiber",
      challenge: "Needed robust security with fiber optic infrastructure for reliable connectivity",
      solution: "Deployed industrial-grade CCTV, access control, fiber optic network, and 24/7 monitoring",
      results: ["Improved operational security", "Reduced insurance premiums", "Enhanced network reliability"]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-company-category">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Customer Success Stories</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Real projects, real results. See how we've helped businesses and homeowners achieve their security goals.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-8 mb-16">
            {caseStudies.map((study) => (
              <Card key={study.title} data-testid={`card-case-${study.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <study.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">{study.category}</Badge>
                      <CardTitle className="text-2xl mb-2">{study.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2 text-primary">Challenge</h3>
                      <p className="text-muted-foreground">{study.challenge}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-primary">Solution</h3>
                      <p className="text-muted-foreground">{study.solution}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-primary">Results</h3>
                      <ul className="space-y-2">
                        {study.results.map((result) => (
                          <li key={result} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">What Our Clients Say</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card data-testid="card-testimonial-1">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground italic mb-4">
                    "The team's professionalism and expertise were evident from day one. Our new security system has transformed how we manage access across our facilities."
                  </p>
                  <p className="font-semibold">- Sarah M., Property Manager</p>
                </CardContent>
              </Card>
              <Card data-testid="card-testimonial-2">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground italic mb-4">
                    "Exceptional service from consultation to installation. The system works flawlessly and the mobile app makes monitoring so convenient."
                  </p>
                  <p className="font-semibold">- David R., Business Owner</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Write Your Success Story?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let's discuss how we can create a custom security solution for your unique needs.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-start-project">
                  Start Your Project
                </Button>
              </GetQuoteDialog>
              <Link href="/login">
                <Button variant="outline" size="lg" data-testid="button-client-portal">
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
