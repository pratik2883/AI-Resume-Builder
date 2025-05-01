import { Server as HttpServer } from 'http';
import greenlockExpress from 'greenlock-express';
import path from 'path';
import fs from 'fs';

// Create storage directory for certificates if it doesn't exist
const CERT_DIR = path.join(process.cwd(), '.ssl');
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

// Greenlock SSL configuration
export function setupSSL(httpServer: HttpServer, domains: string[], email: string): Promise<HttpServer> {
  return new Promise((resolve, reject) => {
    try {
      // Only use SSL in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SSL] Development mode: SSL disabled');
        return resolve(httpServer);
      }

      if (!domains || domains.length === 0) {
        console.warn('[SSL] Warning: No domains specified, SSL disabled');
        return resolve(httpServer);
      }

      if (!email) {
        console.warn('[SSL] Warning: No email specified for SSL certificate, SSL disabled');
        return resolve(httpServer);
      }

      console.log(`[SSL] Setting up SSL certificates for domains: ${domains.join(', ')}`);

      const greenlockInstance = greenlockExpress.init({
        packageRoot: process.cwd(),
        configDir: CERT_DIR,
        maintainerEmail: email,
        cluster: false,
        staging: process.env.SSL_STAGING === 'true', // Use Let's Encrypt staging for testing
      });

      // Configure renewal options
      greenlockInstance.manager.defaults({
        subscriberEmail: email,
        agreeToTerms: true,
        renewOffset: '-45d', // Renew 45 days before expiration
        renewStagger: '3d', // Stagger renewals by 3 days
      });

      // Add domains to certificate list
      domains.forEach((domain) => {
        greenlockInstance.add({
          subject: domain,
          altnames: [domain],
        });
      });

      // Serve with HTTPS
      const httpsServer = greenlockInstance.httpServer();

      console.log('[SSL] Greenlock Express SSL initialized successfully');
      resolve(httpsServer);
    } catch (error) {
      console.error('[SSL] Error setting up SSL:', error);
      // Fall back to HTTP server on SSL setup failure
      resolve(httpServer);
    }
  });
}

// For development and testing SSL locally
export function setupDevSSL(httpServer: HttpServer): HttpServer {
  return httpServer; // In dev environment, just return the HTTP server
}

// This function detects if we're running in production and sets up the appropriate SSL
export async function configureSSL(httpServer: HttpServer): Promise<HttpServer> {
  // Check if we have environment variables for domain and email
  const sslDomains = process.env.SSL_DOMAINS ? process.env.SSL_DOMAINS.split(',') : [];
  const sslEmail = process.env.SSL_EMAIL || '';
  
  if (process.env.NODE_ENV === 'production') {
    return setupSSL(httpServer, sslDomains, sslEmail);
  } else {
    return setupDevSSL(httpServer);
  }
}