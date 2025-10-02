import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import { 
  Users, 
  Award, 
  Clock, 
  Shield,
  ArrowRight,
  CheckCircle2,
  Building2,
  Target,
  Heart
} from "lucide-react";

export default function AboutSection() {
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const achievements = [
    {
      icon: Award,
      title: "Industry Certified",
      description: "UL Listed, FCC Certified, and NFPA Compliant installations"
    },
    {
      icon: Clock,
      title: "15+ Years Experience", 
      description: "Trusted by businesses and homeowners since 2008"
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Licensed technicians with ongoing professional training"
    },
    {
      icon: Shield,
      title: "24/7 Support",
      description: "Emergency response and round-the-clock monitoring"
    }
  ];

  const partnerships = [
    "Southwest Airlines", 
    "ConocoPhillips",
    "Capital One",
    "Enterprise Security Partners"
  ];

  //todo: remove mock functionality - company history
  const milestones = [
    {
      year: "2008",
      title: "FibreUS Founded",
      description: "Established as an independent electronic security contractor"
    },
    {
      year: "2013", 
      title: "Expanded Services",
      description: "Added comprehensive fiber optic installation and maintenance"
    },
    {
      year: "2020",
      title: "Technology Focus",
      description: "Specialized in cloud-based surveillance and remote monitoring"
    },
    {
      year: "2024",
      title: "FibreUS Tech Services",
      description: "Rebranded to reflect our comprehensive security and fiber expertise"
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            About FibreUS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Trusted Security & Fiber Partner
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From our founding in 2008 as an independent security contractor to becoming 
            a leading provider of comprehensive security solutions, we've been protecting what matters most.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Story */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Our Story</h3>
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Since 2008, we've evolved from a small independent security contractor into a 
                comprehensive electronic security solutions provider. Our journey began 
                with a commitment to delivering reliable, cutting-edge security services 
                for homes and businesses across the region.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, FibreUS Tech Services combines decades of experience with 
                cutting-edge technology to deliver reliable, future-proof security 
                and fiber optic systems that protect your most valuable assets.
              </p>
              
              {/* Key Services List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {[
                  "Consulting & Design",
                  "Professional Installation", 
                  "System Integration",
                  "Maintenance & Support",
                  "24/7 Monitoring",
                  "Emergency Response"
                ].map((service) => (
                  <div key={service} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Achievements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={achievement.title} className="hover-elevate" data-testid={`card-achievement-${index}`}>
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-md w-fit mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Our Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <Card key={milestone.year} className="text-center hover-elevate" data-testid={`card-milestone-${index}`}>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {milestone.year}
                  </div>
                  <h4 className="font-semibold mb-2">{milestone.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {milestone.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partnerships */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6">Trusted by Industry Leaders</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8 text-muted-foreground">
            {partnerships.map((partner) => (
              <div key={partner} className="text-sm font-medium">
                {partner}
              </div>
            ))}
          </div>
          
          <Button 
            size="lg" 
            data-testid="button-learn-more-about"
            onClick={() => setShowAboutDialog(true)}
          >
            Learn More About Us
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* About Us Detail Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">About FibreUS Tech Services</DialogTitle>
            <DialogDescription>
              Your trusted partner in electronic security and fiber optic solutions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Mission */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To protect what matters most by delivering reliable, cutting-edge security and fiber optic solutions 
                with exceptional service and technical expertise. We believe that every home and business deserves 
                enterprise-grade security that's accessible, affordable, and backed by a team that genuinely cares.
              </p>
            </div>

            {/* Values */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Our Values</h3>
              </div>
              <ul className="space-y-2">
                {[
                  { title: "Integrity First", desc: "We do what's right, even when no one is watching" },
                  { title: "Technical Excellence", desc: "Continuous learning and industry-leading certifications" },
                  { title: "Customer Focus", desc: "Your security needs drive every decision we make" },
                  { title: "Rapid Response", desc: "24/7 availability for emergencies and urgent service needs" },
                  { title: "Innovation", desc: "Staying ahead with the latest security technology and best practices" }
                ].map((value, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{value.title}:</span>{" "}
                      <span className="text-muted-foreground">{value.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Certifications & Compliance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Certifications & Compliance</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "UL Listed Security Installations",
                  "FCC Certified Equipment",
                  "NFPA 72 Fire Alarm Compliance",
                  "BICSI Fiber Optic Certified",
                  "OSHA Safety Certified",
                  "Licensed & Insured (All States)",
                  "BBB A+ Rating",
                  "State Contractor License #123456"
                ].map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-muted-foreground">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Expertise */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Our Team</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our technicians bring decades of combined experience in electronic security, fire alarm systems, 
                access control, and fiber optic networks. Every team member undergoes rigorous background checks, 
                ongoing training, and maintains multiple industry certifications.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { stat: "15+", label: "Years Experience" },
                  { stat: "50+", label: "Certified Technicians" },
                  { stat: "5,000+", label: "Projects Completed" },
                  { stat: "98%", label: "Customer Satisfaction" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold text-primary">{item.stat}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Area */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Service Area</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We proudly serve residential and commercial clients across the greater metropolitan area 
                and surrounding regions. Our rapid response teams can typically arrive on-site within 2-4 hours 
                for emergency service calls. Contact us to confirm service availability in your specific location.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <GetQuoteDialog>
                <Button className="flex-1" data-testid="button-contact-us-modal">
                  Contact Us
                </Button>
              </GetQuoteDialog>
              <Button 
                variant="outline" 
                className="flex-1" 
                data-testid="button-careers-modal"
                onClick={() => setShowAboutDialog(false)}
              >
                Careers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}