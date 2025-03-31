import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType, users } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      admissionNumber: string;
      password: string;
      profileImageUrl: string | null;
      rank: number | null;
      role: string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configure multer for file uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'files');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const profileUpload = multer({ 
  storage: profileStorage,
  limits: { fileSize: 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export const fileUpload = multer({ 
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'class-management-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'admissionNumber',
        passwordField: 'password',
        passReqToCallback: true
      },
      async (req, admissionNumber, password, done) => {
        try {
          // Log login attempt to debug
          console.log(`Login attempt: Name: ${req.body.name}, Admission: ${admissionNumber}`);
          
          // First try with exact credentials
          let user = await storage.getUserByCredentials(req.body.name, admissionNumber);
          
          // If user not found, try with admission number only (more lenient)
          if (!user) {
            // This is a fallback to handle case sensitivity or spacing differences
            const [userByAdmission] = await db.select().from(users).where(eq(users.admissionNumber, admissionNumber));
            user = userByAdmission;
          }
          
          if (!user) {
            console.log(`User not found with admission number: ${admissionNumber}`);
            return done(null, false);
          }
          
          // Check password
          const isPasswordValid = await comparePasswords(password, user.password);
          if (!isPasswordValid) {
            console.log(`Invalid password for user: ${user.name}`);
            return done(null, false);
          }
          
          // Format user to match Express.User interface
          const userSession = {
            id: user.id,
            name: user.name,
            admissionNumber: user.admissionNumber,
            password: user.password,
            profileImageUrl: user.profileImageUrl || null,
            rank: user.rank || null,
            role: user.role || null
          };
          
          console.log(`Login successful for: ${user.name}`);
          return done(null, userSession);
        } catch (err) {
          console.error('Authentication error:', err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user with id: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.error(`User with id ${id} not found in database`);
        return done(null, false); // Using false instead of an error to prevent repeated errors
      }
      
      // Explicitly cast the user to match the expected Express.User type
      const userSession = {
        id: user.id,
        name: user.name,
        admissionNumber: user.admissionNumber,
        password: user.password,
        profileImageUrl: user.profileImageUrl || null,
        rank: user.rank || null,
        role: user.role || null
      };
      
      console.log(`Successfully deserialized user: ${user.name}`);
      done(null, userSession);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(null, false); // Using false instead of passing the error
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Update password
  app.patch("/api/user/password", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).send("Current and new password required");
      }
      
      const user = await storage.getUser(req.user.id);
      
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).send("Current password is incorrect");
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
      
      // Update the session user data so they can stay logged in
      req.user.password = hashedPassword;
      
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });

  // Update profile image
  app.patch("/api/user/profile-image", profileUpload.single('profileImage'), async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }
      
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = await storage.updateUserProfileImage(req.user.id, imageUrl);
      
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });
}
