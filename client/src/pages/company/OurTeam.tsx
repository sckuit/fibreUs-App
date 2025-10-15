import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, Wrench, Shield } from "lucide-react";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";

export default function OurTeam() {
  const team = [
    { 
      name: "Michael Rodriguez", 
      role: "Chief Executive Officer", 
      bio: "With 20+ years in the security industry, Michael leads our team with vision and expertise.",
      certifications: ["MBA", "NICET Level III", "PSP"]
    },
    { 
      name: "Sarah Chen", 
      role: "Director of Operations", 
      bio: "Sarah ensures every project is executed flawlessly, from planning to final installation.",
      certifications: ["PMP", "NICET Level II", "CPP"]
    },
    { 
      name: "James Thompson", 
      role: "Lead Security Engineer", 
      bio: "James designs custom security solutions tailored to each client's unique needs.",
      certifications: ["NICET Level IV", "CTS", "RCDD"]
    },
    { 
      name: "Maria Garcia", 
      role: "Customer Success Manager", 
      bio: "Maria ensures our clients receive exceptional service and support at every step.",
      certifications: ["CSP", "ITIL", "Six Sigma"]
    },
  ];

  const departments = [
    { icon: Shield, title: "Security Specialists", count: "12+", description: "Certified security professionals" },
    { icon: Wrench, title: "Installation Team", count: "20+", description: "Licensed technicians" },
    { icon: Award, title: "Project Managers", count: "8+", description: "PMP certified managers" },
    { icon: Users, title: "Support Staff", count: "15+", description: "Dedicated support team" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-company-category">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Our Expert Team</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Meet the certified professionals who make security excellence our standard.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Leadership Team</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
            {team.map((member) => (
              <Card key={member.name} data-testid={`card-team-${member.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                  <p className="text-primary font-semibold">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{member.bio}</p>
                  <div>
                    <p className="text-sm font-semibold mb-2">Certifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.certifications.map((cert) => (
                        <Badge key={cert} variant="secondary">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Our Departments</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {departments.map((dept) => (
              <Card key={dept.title} data-testid={`card-dept-${dept.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <dept.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{dept.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary mb-2">{dept.count}</p>
                  <p className="text-muted-foreground">{dept.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-4 text-center">Why Our Team Stands Out</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">Continuous Training</h3>
                <p className="text-muted-foreground">
                  Our team receives ongoing training on the latest security technologies and installation techniques.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Industry Certifications</h3>
                <p className="text-muted-foreground">
                  Every technician holds relevant industry certifications and licenses for your peace of mind.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Customer Focused</h3>
                <p className="text-muted-foreground">
                  We prioritize clear communication and exceptional service on every project.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Safety First</h3>
                <p className="text-muted-foreground">
                  All team members are background-checked and follow strict safety protocols.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Work With Our Expert Team</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the difference that professional expertise makes in your security solution.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Free Quote
                </Button>
              </GetQuoteDialog>
              <LoginDialog>
                <Button variant="outline" size="lg" data-testid="button-client-portal">
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
