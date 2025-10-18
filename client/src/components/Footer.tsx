import { useQuery } from "@tanstack/react-query";
import type { SystemConfig } from "@shared/schema";
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
import LoginDialog from "@/components/LoginDialog";

export default function Footer() {
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const services = [
    { name: "CCTV Installation", url: "/services/cctv-installation" },
    { name: "Alarm Systems", url: "/services/alarm-systems" },
    { name: "Access Control", url: "/services/access-control" },
    { name: "Intercom Systems", url: "/services/intercom-systems" },
    { name: "Cloud Storage", url: "/services/cloud-storage" },
    { name: "Remote Monitoring", url: "/services/remote-monitoring" }
  ];

  const company = [
    { name: "About Us", url: "/company/about-us" },
    { name: "Our Team", url: "/company/our-team" },
    { name: "Certifications", url: "/company/certifications" },
    { name: "Careers", url: "/company/careers" }
  ];

  const support = [
    { name: "Technical Support", url: "/support/technical-support" },
    { name: "Maintenance", url: "/support/maintenance" },
    { name: "Training", url: "/support/training" }
  ];

  const legal = [
    { name: "Privacy Policy", url: "/legal/privacy-policy" },
    { name: "Terms of Service", url: "/legal/terms-of-service" },
    { name: "Service Agreement", url: "/legal/service-agreement" },
    { name: "Warranty Information", url: "/legal/warranty-information" }
  ];

  const companyName = config?.companyName || "FibreUS";
  const phoneNumber = config?.phoneNumber || "(555) 123-4567";
  const contactEmail = config?.contactEmail || "info@fibreus.co";
  const address = config?.address || "123 Security Blvd, Washington, DC 20001";

  return (
    <footer className="bg-card border-t">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {config?.logoUrl ? (
                <img src={config.logoUrl} alt={`${companyName} Logo`} className="h-8 w-8 object-contain" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
              <div>
                <div className="text-lg font-bold">{companyName}</div>
                <div className="text-xs text-muted-foreground">Tech Services</div>
              </div>
            </Link>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {config?.aboutUs || "Professional electronic security and fiber optic solutions serving the DMV area (DC, Maryland, Virginia) since 2008. Licensed, insured, and committed to protecting what matters most."}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>{phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span>{contactEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{address}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline">24/7 Support</Badge>
            </div>

            {/* Social Media Links */}
            {(config?.facebookUrl || config?.twitterUrl || config?.linkedinUrl || config?.instagramUrl) && (
              <div className="flex gap-3">
                {config.facebookUrl && (
                  <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {config.twitterUrl && (
                  <a href={config.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {config.linkedinUrl && (
                  <a href={config.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {config.instagramUrl && (
                  <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <Link href={service.url} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {service.name}
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
                <li key={item.name}>
                  <Link href={item.url} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <LoginDialog>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors text-left" data-testid="link-client-portal-footer">
                    Client Portal
                  </button>
                </LoginDialog>
              </li>
              {support.map((item) => (
                <li key={item.name}>
                  <Link href={item.url} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-6 bg-primary/5">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {legal.map((item, index) => (
              <span key={item.name} className="flex items-center gap-1">
                <Link href={item.url} className="hover:text-primary transition-colors">
                  {item.name}
                </Link>
                {index < legal.length - 1 && <span className="text-border">|</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            © 2024 {companyName}. All rights reserved. | Licensed Security Contractor
          </p>
        </div>
      </div>
    </footer>
  );
}