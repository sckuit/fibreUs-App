import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, TrendingUp, Heart, Users } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function Careers() {
  const benefits = [
    { icon: TrendingUp, title: "Career Growth", description: "Continuous training and advancement opportunities" },
    { icon: Heart, title: "Great Benefits", description: "Health insurance, 401(k), paid time off" },
    { icon: Users, title: "Team Culture", description: "Collaborative environment with supportive colleagues" },
    { icon: Briefcase, title: "Job Security", description: "Stable company with consistent growth" },
  ];

  const openings = [
    {
      title: "Security Systems Installer",
      type: "Full-Time",
      location: "Multiple Locations",
      description: "Install and configure CCTV, alarm systems, and access control for residential and commercial clients.",
      requirements: ["Valid driver's license", "Basic electrical knowledge", "Customer service skills", "Willingness to learn"]
    },
    {
      title: "Security System Designer",
      type: "Full-Time",
      location: "Main Office",
      description: "Design custom security solutions and create technical specifications for client projects.",
      requirements: ["NICET certification preferred", "CAD experience", "5+ years in security industry", "Strong technical writing"]
    },
    {
      title: "Customer Support Specialist",
      type: "Full-Time",
      location: "Remote/Office",
      description: "Provide technical support and assistance to clients using our security systems.",
      requirements: ["Technical aptitude", "Excellent communication", "Problem-solving skills", "Security system knowledge"]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-company-category">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Join Our Team</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Build your career with a leader in electronic security solutions. We're always looking for talented individuals to join our growing team.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Work With Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit) => (
              <Card key={benefit.title} data-testid={`card-benefit-${benefit.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <benefit.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Our Culture</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-muted-foreground mb-4">
                At FibreUS, we believe in fostering a culture of excellence, innovation, and mutual respect. 
                Our team members are our greatest asset, and we invest in their growth and development.
              </p>
              <p className="text-muted-foreground">
                We offer competitive salaries, comprehensive benefits, and a work environment where your 
                contributions are valued and recognized. Join us and be part of a team that's setting new 
                standards in the security industry.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Current Openings</h2>
          <div className="space-y-6 mb-16 max-w-4xl mx-auto">
            {openings.map((job) => (
              <Card key={job.title} data-testid={`card-job-${job.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="mb-2">{job.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{job.type}</Badge>
                        <Badge variant="outline">{job.location}</Badge>
                      </div>
                    </div>
                    <GetQuoteDialog>
                      <Button data-testid={`button-apply-${job.title.toLowerCase().replace(/\s/g, '-')}`}>
                        Apply Now
                      </Button>
                    </GetQuoteDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{job.description}</p>
                  <div>
                    <p className="font-semibold mb-2">Requirements:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {job.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Don't See the Perfect Role?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              We're always interested in hearing from talented professionals. Send us your resume and let's talk about opportunities.
            </p>
            <GetQuoteDialog>
              <Button variant="secondary" size="lg" data-testid="button-send-resume">
                Send Your Resume
              </Button>
            </GetQuoteDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
