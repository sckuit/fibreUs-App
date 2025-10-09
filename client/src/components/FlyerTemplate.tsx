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
import { type Lead } from "@shared/schema";

interface FlyerTemplateProps {
  lead: Lead;
  selectedServices: string[];
}

const serviceDetails: Record<string, { name: string; description: string; IconComponent: any }> = {
  cctv: {
    name: "CCTV Surveillance Systems",
    description: "Advanced video monitoring solutions with HD cameras, night vision, and remote viewing capabilities for comprehensive security coverage.",
    IconComponent: Video
  },
  alarm: {
    name: "Alarm Systems",
    description: "State-of-the-art intrusion detection systems with 24/7 monitoring, instant alerts, and rapid response integration.",
    IconComponent: Bell
  },
  access_control: {
    name: "Access Control Systems",
    description: "Secure entry management with biometric scanners, key cards, and digital access logs for enhanced facility protection.",
    IconComponent: Lock
  },
  intercom: {
    name: "Intercom Systems",
    description: "Modern communication solutions for seamless visitor management and internal communications.",
    IconComponent: Phone
  },
  cloud_storage: {
    name: "Cloud Storage Solutions",
    description: "Secure cloud-based video storage with easy access, backup redundancy, and scalable capacity.",
    IconComponent: Cloud
  },
  monitoring: {
    name: "24/7 Monitoring Services",
    description: "Professional monitoring center support with trained security personnel watching your property around the clock.",
    IconComponent: Eye
  },
  fiber_installation: {
    name: "Fiber Optic Installation",
    description: "High-speed fiber optic network installation for reliable, fast connectivity and future-proof infrastructure.",
    IconComponent: Network
  },
  maintenance: {
    name: "Maintenance & Support",
    description: "Comprehensive maintenance packages ensuring your security systems operate at peak performance year-round.",
    IconComponent: Wrench
  }
};

export const FlyerTemplate = forwardRef<HTMLDivElement, FlyerTemplateProps>(
  ({ lead, selectedServices }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[800px] bg-white text-gray-900 p-12 space-y-8"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-4 border-[#1e3a5f] pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#1e3a5f] mb-2">FibreUS</h1>
              <p className="text-lg text-[#4a90e2]">Electronic Security & Fiber Optic Services</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold">Professional Solutions For</p>
              <p className="text-xl font-bold text-[#1e3a5f] mt-1">{lead.company || lead.name}</p>
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
            <Shield className="w-8 h-8 text-[#4a90e2]" />
            Recommended Services for Your Business
          </h2>
          <div className="space-y-4">
            {selectedServices.map((serviceKey) => {
              const service = serviceDetails[serviceKey];
              if (!service) return null;
              const ServiceIcon = service.IconComponent;
              
              return (
                <div key={serviceKey} className="border-l-4 border-[#4a90e2] pl-4 py-2">
                  <h3 className="text-lg font-bold text-[#1e3a5f] flex items-center gap-2">
                    <ServiceIcon className="w-6 h-6 text-[#4a90e2]" />
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Why Partner With FibreUS?</h2>
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
          <div className="flex justify-between items-end">
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1e3a5f]" />
                <span className="font-semibold">Email:</span>
                <span className="text-[#4a90e2]">info@fibreus.com</span>
              </p>
              <p className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-[#1e3a5f]" />
                <span className="font-semibold">Phone:</span>
                <span className="text-[#4a90e2]">1-800-FIBREUS</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1e3a5f]" />
                <span className="font-semibold">Web:</span>
                <span className="text-[#4a90e2]">www.fibreus.com</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-2">Prepared for:</p>
              <p className="font-semibold text-[#1e3a5f]">{lead.name}</p>
              {lead.email && <p className="text-sm text-gray-600">{lead.email}</p>}
              {lead.phone && <p className="text-sm text-gray-600">{lead.phone}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>FibreUS - Your Trusted Security Partner | Licensed, Bonded & Insured</p>
          <p className="mt-1">© 2025 FibreUS. All rights reserved.</p>
        </div>
      </div>
    );
  }
);

FlyerTemplate.displayName = "FlyerTemplate";
