import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Award, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import { useQuery } from "@tanstack/react-query";

type SystemConfig = {
  companyName?: string;
  mission?: string;
  aboutUs?: string;
  phoneNumber?: string;
  contactEmail?: string;
};

export default function AboutUs() {
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const values = [
    { icon: Target, title: "Excellence", description: "We deliver the highest quality security solutions with meticulous attention to detail" },
    { icon: Users, title: "Customer First", description: "Your safety and satisfaction are our top priorities in every project" },
    { icon: Award, title: "Integrity", description: "Honest, transparent service with industry-leading certifications and standards" },
    { icon: TrendingUp, title: "Innovation", description: "Staying ahead with the latest security technology and best practices" },
  ];

  const companyName = config?.companyName || "FibreUS";
  const mission = config?.mission || "To provide cutting-edge security solutions that protect what matters most to our clients.";
  const aboutUs = config?.aboutUs || `${companyName} is a leading provider of electronic security and fiber optic solutions. With over 15 years of experience, we've protected hundreds of properties with state-of-the-art surveillance, access control, and alarm systems.`;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-company-category">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">About {companyName}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Leading the industry in professional security solutions and fiber optic installations since 2008.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-lg text-muted-foreground mb-4" data-testid="text-about-us">
              {aboutUs}
            </p>
            <p className="text-lg text-muted-foreground">
              Our team of certified technicians brings decades of combined experience to every 
              installation. We pride ourselves on staying at the forefront of security technology, 
              ensuring our clients benefit from the most advanced and reliable systems available.
            </p>
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-4 text-center">Our Mission</h2>
            <p className="text-center text-lg max-w-3xl mx-auto" data-testid="text-mission">
              {mission}
            </p>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((value) => (
              <Card key={value.title} data-testid={`card-value-${value.title.toLowerCase()}`}>
                <CardHeader>
                  <value.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card data-testid="card-stat-experience">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">15+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Years of Excellence</p>
              </CardContent>
            </Card>
            <Card data-testid="card-stat-clients">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">500+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Satisfied Clients</p>
              </CardContent>
            </Card>
            <Card data-testid="card-stat-projects">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">1,200+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Projects Completed</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Property?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Contact us today for a free consultation and discover how we can protect what matters most to you.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-consultation">
                  Get Free Consultation
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
