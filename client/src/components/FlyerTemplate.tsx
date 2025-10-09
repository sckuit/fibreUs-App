import { forwardRef } from "react";
import { 
  Video, 
  Bell, 
  Lock, 
  Phone, 
  Cloud, 
  Eye, 
  Network, 
  Wrench,
  Shield,
  CheckCircle,
  Mail,
  Phone as PhoneIcon,
  Globe
} from "lucide-react";
import { type Lead, type SystemConfig, type ServiceType } from "@shared/schema";

interface FlyerTemplateProps {
  lead: Lead;
  selectedServices: string[];
  systemConfig?: SystemConfig;
  serviceTypes: ServiceType[];
}

// Map service names to icons
const iconMap: Record<string, any> = {
  cctv: Video,
  alarm: Bell,
  access_control: Lock,
  intercom: Phone,
  cloud_storage: Cloud,
  monitoring: Eye,
  fiber_installation: Network,
  maintenance: Wrench,
};

export const FlyerTemplate = forwardRef<HTMLDivElement, FlyerTemplateProps>(
  ({ lead, selectedServices, systemConfig, serviceTypes }, ref) => {
    const companyName = "FibreUS"; // Static for now as schema doesn't have companyName
    const headerTagline = systemConfig?.headerTagline || "Electronic Security & Fiber Optic Services";
    const footerTagline = systemConfig?.footerTagline || "Your Trusted Security Partner | Licensed, Bonded & Insured";
    const contactEmail = systemConfig?.contactEmail || "info@fibreus.com";
    const phoneNumber = systemConfig?.phoneNumber || "1-800-FIBREUS";
    const website = systemConfig?.website || "www.fibreus.com";
    const logoUrl = systemConfig?.logoUrl;

    const selectedServiceDetails = selectedServices
      .map(serviceName => serviceTypes?.find(st => st.name === serviceName))
      .filter(Boolean) as ServiceType[];

    return (
      <div
        ref={ref}
        className="w-[800px] bg-white text-gray-900 p-12 space-y-8"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-4 border-[#1e3a5f] pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 flex items-start gap-4">
              {/* Logo */}
              {logoUrl ? (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                  <img 
                    src={logoUrl} 
                    alt={companyName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#4a90e2] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Network className="w-8 h-8 text-white mx-auto mb-0.5" />
                    <div className="text-[8px] font-bold text-white tracking-wider">FIBRE</div>
                  </div>
                </div>
              )}
              {/* Company Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-[#1e3a5f] mb-2">{companyName}</h1>
                <p className="text-lg text-[#4a90e2]">{headerTagline}</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600 flex-shrink-0">
              <p className="font-semibold whitespace-nowrap">Professional Solutions For</p>
              <p className="text-xl font-bold text-[#1e3a5f] mt-1 break-words max-w-[300px]">{lead.company || lead.name}</p>
            </div>
          </div>
        </div>

        {/* Personalized Introduction */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#4a90e2] text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Dear {lead.name},</h2>
          <p className="text-base leading-relaxed">
            Thank you for your interest in our security solutions. We're excited to present our professional services
            tailored to meet your specific needs. Our team of certified technicians is ready to enhance your security infrastructure.
          </p>
        </div>

        {/* Services Offered */}
        <div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
            <Shield className="w-8 h-8 text-[#4a90e2] flex-shrink-0" />
            <span>Recommended Services for Your Business</span>
          </h2>
          <div className="space-y-4">
            {selectedServiceDetails.map((service) => {
              const IconComponent = iconMap[service.name] || Shield;
              
              return (
                <div key={service.id} className="border-l-4 border-[#4a90e2] pl-4 py-2">
                  <h3 className="text-lg font-bold text-[#1e3a5f] flex items-start gap-2 mb-1">
                    <IconComponent className="w-6 h-6 text-[#4a90e2] flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{service.displayName}</span>
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Why Partner With {companyName}?</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Certified Professionals</p>
                <p className="text-gray-600">Licensed & insured technicians</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">24/7 Support</p>
                <p className="text-gray-600">Round-the-clock assistance</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Latest Technology</p>
                <p className="text-gray-600">Cutting-edge equipment</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Custom Solutions</p>
                <p className="text-gray-600">Tailored to your needs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Let's Get Started</h2>
          <div className="flex justify-between items-start gap-6">
            <div className="space-y-2 text-sm flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1e3a5f] flex-shrink-0" />
                <span className="font-semibold whitespace-nowrap">Email:</span>
                <span className="text-[#4a90e2]">{contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-[#1e3a5f] flex-shrink-0" />
                <span className="font-semibold whitespace-nowrap">Phone:</span>
                <span className="text-[#4a90e2]">{phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1e3a5f] flex-shrink-0" />
                <span className="font-semibold whitespace-nowrap">Web:</span>
                <span className="text-[#4a90e2]">{website}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 max-w-[300px]">
              <p className="text-xs text-gray-500 mb-2">Prepared for:</p>
              <p className="font-semibold text-[#1e3a5f] break-words">{lead.name}</p>
              {lead.email && <p className="text-sm text-gray-600 break-all">{lead.email}</p>}
              {lead.phone && <p className="text-sm text-gray-600 whitespace-nowrap">{lead.phone}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>{footerTagline}</p>
          <p className="mt-1">© 2025 {companyName}. All rights reserved.</p>
        </div>
      </div>
    );
  }
);

FlyerTemplate.displayName = "FlyerTemplate";
