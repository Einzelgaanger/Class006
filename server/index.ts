import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { seed } from "./seed";
import fs from "fs";
import path from "path";

// Ensure necessary directories exist
function ensureDirectoriesExist() {
  // Ensure upload directories exist
  const uploadDirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads/profiles'),
    path.join(process.cwd(), 'uploads/files')
  ];
  
  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Set default environment variables if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'sds-year2-group-b-very-secret-key';
  console.log('WARNING: Using default session secret. Set SESSION_SECRET environment variable in production.');
}

// Create upload directories
ensureDirectoriesExist();

// Print environment information for debugging
console.log(`Starting server in ${process.env.NODE_ENV} mode`);
console.log(`Using database: ${process.env.DATABASE_URL ? 'External database (via DATABASE_URL)' : 'Default database'}`);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercept JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Add response data for debugging but limit size
      if (capturedJsonResponse) {
        // Mask password fields for security
        const sanitizedResponse = { ...capturedJsonResponse };
        if (sanitizedResponse.password) sanitizedResponse.password = '******';
        
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 100) {
        logLine = logLine.slice(0, 99) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database before setting up routes
  await initializeDatabase();
  
  // Run seed script to ensure all required users and data are present
  try {
    await seed();
    log("Seed process completed", "seed");
  } catch (error) {
    log(`Seed error: ${(error as Error).message}`, "seed");
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error with more details for debugging
    console.error('API ERROR:', {
      status,
      message,
      stack: err.stack,
      path: _req.path,
      method: _req.method,
      query: _req.query,
      body: _req.body ? JSON.stringify(_req.body).substring(0, 200) : null
    });

    // Send a sanitized error response
    res.status(status).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? (status === 500 ? 'Internal Server Error' : message)
        : message
    });
    
    // Don't throw the error after handling it
    // This prevents the server from crashing
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
