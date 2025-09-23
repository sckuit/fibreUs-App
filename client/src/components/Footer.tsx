import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Phone, 
  Mail, 
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const services = [
    "CCTV Installation",
    "Alarm Systems", 
    "Access Control",
    "Intercom Systems",
    "Cloud Storage",
    "Remote Monitoring"
  ];

  const company = [
    "About Us",
    "Our Team", 
    "Certifications",
    "Case Studies",
    "Careers",
    "News & Updates"
  ];

  const support = [
    "Client Portal",
    "System Status",
    "Technical Support", 
    "Emergency Service",
    "Maintenance",
    "Training"
  ];

  const legal = [
    "Privacy Policy",
    "Terms of Service",
    "Service Agreement",
    "Warranty Information"
  ];

  return (
    <footer className="bg-card border-t">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="text-lg font-bold">FibreUS</div>
                <div className="text-xs text-muted-foreground">Tech Services</div>
              </div>
            </Link>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Professional electronic security and fiber optic solutions serving Dallas and surrounding areas 
              since 2008. Licensed, insured, and committed to protecting what matters most.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@fibreus.co</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Security Blvd, Dallas, TX 75201</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Licensed & Insured</Badge>
              <Badge variant="outline">UL Listed</Badge>
              <Badge variant="outline">24/7 Support</Badge>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <Link 
                    href="/services" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item}>
                  <Link 
                    href="/about" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {support.map((item) => (
                <li key={item}>
                  <Link 
                    href="/support" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button size="sm" variant="destructive" className="w-full" data-testid="button-emergency-footer">
                Emergency: (555) 911-HELP
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {legal.map((item, index) => (
              <span key={item} className="flex items-center gap-1">
                <Link href="/legal" className="hover:text-primary transition-colors">
                  {item}
                </Link>
                {index < legal.length - 1 && <span className="text-border">|</span>}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-facebook">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-twitter">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-linkedin">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-instagram">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            © 2024 Fibre US Tech Services. All rights reserved. | Licensed Security Contractor
          </p>
        </div>
      </div>
    </footer>
  );
}