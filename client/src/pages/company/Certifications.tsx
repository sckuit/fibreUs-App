import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Shield, CheckCircle, FileCheck } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function Certifications() {
  const certifications = [
    { 
      name: "UL Listed Equipment", 
      description: "All our equipment meets Underwriters Laboratories safety standards",
      icon: Award
    },
    { 
      name: "FCC Certified", 
      description: "Federal Communications Commission compliance for all wireless systems",
      icon: Shield
    },
    { 
      name: "NFPA Compliant", 
      description: "National Fire Protection Association standards for fire alarm systems",
      icon: FileCheck
    },
    { 
      name: "NICET Certified", 
      description: "National Institute for Certification in Engineering Technologies",
      icon: Award
    },
  ];

  const licenses = [
    "State Contractor License #123456",
    "Low Voltage Specialty License",
    "Fire Alarm System License",
    "Alarm Company Operator License",
    "General Liability Insurance - $2M",
    "Workers Compensation Insurance",
  ];

  const standards = [
    { name: "ISO 9001:2015", description: "Quality Management Systems" },
    { name: "TIA-568", description: "Commercial Building Telecommunications Cabling Standard" },
    { name: "NFPA 72", description: "National Fire Alarm and Signaling Code" },
    { name: "UL 2050", description: "Standard for National Industrial Security Systems" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-company-category">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Certifications & Compliance</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Fully licensed, certified, and insured for your peace of mind. We maintain the highest industry standards.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Industry Certifications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {certifications.map((cert) => (
              <Card key={cert.name} data-testid={`card-cert-${cert.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <cert.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{cert.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card data-testid="card-licenses">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Licenses & Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {licenses.map((license) => (
                    <li key={license} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>{license}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-standards">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                  Compliance Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {standards.map((standard) => (
                    <div key={standard.name}>
                      <p className="font-semibold">{standard.name}</p>
                      <p className="text-sm text-muted-foreground">{standard.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Certifications Matter</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">
                  Certified equipment and installation methods ensure reliable, long-lasting performance
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Safety & Compliance</h3>
                <p className="text-muted-foreground">
                  Meet all local codes, insurance requirements, and safety regulations
                </p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Professional Service</h3>
                <p className="text-muted-foreground">
                  Certified technicians with proven expertise and ongoing training
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Trust the Certified Experts</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Our certifications and compliance guarantee that your security system meets the highest standards.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-get-certified-quote">
                  Get Certified Installation
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
