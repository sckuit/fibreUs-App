import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

interface ExtendedRequest extends Request {
  visitorSessionId?: string;
}

// Store session IDs to track unique visitors (in production, use Redis)
const sessionCache = new Set<string>();

export const trackVisitor = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    // Skip tracking for API routes, static files, and admin routes
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/assets/') || 
        req.path.includes('.') ||
        req.path.startsWith('/admin/')) {
      return next();
    }

    // Get visitor information from request
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || req.headers.referrer as string || '';
    
    // Parse user agent for device/browser info
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();
    
    // Generate or get session ID for this visitor
    const sessionSeed = `${ipAddress}_${userAgent}`;
    const sessionId = crypto.createHash('md5').update(sessionSeed).digest('hex');
    
    // Check if this is a unique visit
    const isFirstVisit = !sessionCache.has(sessionId);
    
    // Only track if it's a new session or first visit
    if (isFirstVisit) {
      // Add to session cache
      sessionCache.add(sessionId);
      
      // Get basic geolocation info (in production, use a real IP geolocation service)
      const country = req.headers['cf-ipcountry'] as string || 'Unknown';
      const city = 'Unknown'; // Would use IP geolocation service
      
      // Prepare visitor data
      const visitorData = {
        sessionId,
        ipAddress: ipAddress?.split(',')[0]?.trim() || 'Unknown', // Handle multiple IPs
        userAgent,
        referrer: referrer || null,
        landingPage: req.originalUrl || req.path,
        country: country !== 'Unknown' ? country : null,
        city: city !== 'Unknown' ? city : null,
        browser: uaResult.browser.name || null,
        device: uaResult.device.type || 'desktop',
        operatingSystem: uaResult.os.name || null,
        isFirstVisit: true,
      };

      // Track visitor asynchronously (don't block the request)
      storage.trackVisitor(visitorData).catch(error => {
        console.error('Failed to track visitor:', error);
      });
    }
    
    // Attach session ID to request for potential use by other middleware
    req.visitorSessionId = sessionId;
    
    next();
  } catch (error) {
    console.error('Visitor tracking middleware error:', error);
    // Don't block the request if tracking fails
    next();
  }
};

// Utility function to get visitor geolocation (placeholder for real implementation)
async function getGeolocationFromIP(ip: string): Promise<{ country: string; city: string }> {
  // In production, use a service like:
  // - ipinfo.io
  // - ipapi.co
  // - maxmind GeoLite2
  // For now, return placeholder data
  return {
    country: 'Unknown',
    city: 'Unknown'
  };
}

// Cleanup old sessions periodically (in production, use Redis TTL)
setInterval(() => {
  if (sessionCache.size > 10000) {
    sessionCache.clear();
  }
}, 60 * 60 * 1000); // Clear every hour if too many sessions