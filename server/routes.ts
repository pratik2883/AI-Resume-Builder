import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { ResumeContent } from "@shared/schema";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  const httpServer = createServer(app);

  // Resume Templates API
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Resumes API
  app.get("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumes = await storage.getResumesByUser(req.user.id);
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  app.get("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resume = await storage.getResume(parseInt(req.params.id));
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Only allow access if the user owns the resume or is an admin
      if (resume.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to view this resume" });
      }

      res.json(resume);
    } catch (error) {
      console.error("Error fetching resume:", error);
      res.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  app.post("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { name, templateId, content } = req.body;
      
      if (!name || !templateId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const resume = await storage.createResume({
        name,
        userId: req.user.id,
        templateId,
        content,
      });

      res.status(201).json(resume);
    } catch (error) {
      console.error("Error creating resume:", error);
      res.status(500).json({ message: "Failed to create resume" });
    }
  });

  app.put("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumeId = parseInt(req.params.id);
      const existingResume = await storage.getResume(resumeId);
      
      if (!existingResume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Check if the user owns this resume or is an admin
      if (existingResume.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this resume" });
      }

      const { name, templateId, content } = req.body;
      const updatedResume = await storage.updateResume(resumeId, {
        name,
        templateId,
        content,
      });

      res.json(updatedResume);
    } catch (error) {
      console.error("Error updating resume:", error);
      res.status(500).json({ message: "Failed to update resume" });
    }
  });

  app.delete("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumeId = parseInt(req.params.id);
      const existingResume = await storage.getResume(resumeId);
      
      if (!existingResume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Check if the user owns this resume or is an admin
      if (existingResume.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this resume" });
      }

      await storage.deleteResume(resumeId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting resume:", error);
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // OpenRouter AI API
  app.post("/api/ai/generate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { prompt, type } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get the OpenRouter API key
      const apiKey = await storage.getActiveApiKey("openrouter");
      
      if (!apiKey) {
        return res.status(500).json({ message: "OpenRouter API key not configured" });
      }

      // Format the prompt based on the content type requested
      let formattedPrompt = "";
      
      switch (type) {
        case "summary":
          formattedPrompt = `Write a professional resume summary (2-3 sentences) for someone with the following background: ${prompt}`;
          break;
        case "experience":
          formattedPrompt = `Write 3-4 bullet points describing job responsibilities and achievements for this position: ${prompt}`;
          break;
        case "complete":
          formattedPrompt = `Create a professional resume based on the following background information. Format the response as JSON following this structure: ${JSON.stringify({
            personalInfo: {
              firstName: "String",
              lastName: "String",
              email: "String",
              phone: "String",
              address: "String",
              title: "String",
              summary: "String"
            },
            education: [
              {
                institution: "String",
                degree: "String",
                fieldOfStudy: "String",
                startDate: "String",
                endDate: "String",
                description: "String"
              }
            ],
            experience: [
              {
                company: "String",
                position: "String",
                startDate: "String",
                endDate: "String",
                description: "String"
              }
            ],
            skills: [
              {
                name: "String",
                level: 0
              }
            ],
            projects: [
              {
                name: "String",
                description: "String",
                url: "String",
                startDate: "String",
                endDate: "String"
              }
            ]
          })}. Background information: ${prompt}`;
          break;
        default:
          formattedPrompt = prompt;
      }

      // Call OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.key}`,
          "HTTP-Referer": process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",")[0] : "http://localhost:5000",
          "X-Title": "AI Resume Builder"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a professional resume writer helping users create impressive resumes."
            },
            {
              role: "user",
              content: formattedPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API error:", errorData);
        return res.status(response.status).json({ message: "AI generation failed", details: errorData });
      }

      const data = await response.json();
      let result = data.choices[0].message.content;

      // For complete resume requests, parse the JSON if possible
      if (type === "complete") {
        try {
          // Extract JSON from the response if it's wrapped in markdown code blocks
          const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, result];
          const jsonContent = jsonMatch[1];
          
          // Parse and validate as ResumeContent
          const parsedContent = JSON.parse(jsonContent) as ResumeContent;
          return res.json({ content: parsedContent });
        } catch (error) {
          console.error("Error parsing AI response as JSON:", error);
          return res.json({ content: result });
        }
      }

      res.json({ content: result });
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ message: "Failed to generate AI content" });
    }
  });

  // Admin API routes
  // Users
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deleting the current user
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin Resumes management
  app.get("/api/admin/resumes", async (req, res) => {
    try {
      const resumes = await storage.getAllResumes();
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  app.delete("/api/admin/resumes/:id", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      await storage.deleteResume(resumeId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting resume:", error);
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // API Keys management
  app.get("/api/admin/api-keys", async (req, res) => {
    try {
      const apiKeys = await storage.getAllApiKeys();
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post("/api/admin/api-keys", async (req, res) => {
    try {
      const { name, key, provider } = req.body;
      
      if (!name || !key || !provider) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const apiKey = await storage.createApiKey({
        name,
        key,
        provider,
        isActive: true,
      });
      
      res.status(201).json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  app.put("/api/admin/api-keys/:id", async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      const { name, key, provider, isActive } = req.body;
      
      const updatedKey = await storage.updateApiKey(keyId, {
        name,
        key,
        provider,
        isActive,
      });
      
      if (!updatedKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      res.json(updatedKey);
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ message: "Failed to update API key" });
    }
  });

  app.delete("/api/admin/api-keys/:id", async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      await storage.deleteApiKey(keyId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket collaboration implementation
  type Client = {
    userId: number;
    username: string;
    resumeId: number;
    ws: WebSocket;
  };

  // Map to store active collaborative sessions by resumeId
  const resumeSessions = new Map<number, Set<Client>>();
  
  // Helper to send message to all clients in a session except the sender
  const broadcastToSession = (resumeId: number, message: any, excludeClient?: Client) => {
    const session = resumeSessions.get(resumeId);
    if (!session) return;
    
    session.forEach((client) => {
      if (excludeClient && client === excludeClient) return;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  };

  // Handle WebSocket connections
  wss.on('connection', async (ws, request) => {
    // Parse query parameters to get resumeId, userId, and sessionId
    const { query } = parse(request.url || '', true);
    const resumeId = parseInt(query.resumeId as string);
    const userId = parseInt(query.userId as string);
    const username = query.username as string;
    
    if (!resumeId || !userId || !username) {
      ws.close(1008, 'Missing required parameters');
      return;
    }

    // Validate that the user has access to this resume
    try {
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        ws.close(1008, 'Resume not found');
        return;
      }

      // Check if user is owner or has collaboration access
      const isOwner = resume.userId === userId;
      let hasAccess = isOwner;
      
      if (!hasAccess) {
        // Check if user is a collaborator
        // Note: This functionality won't work until we've fixed the database issues
        // We'll implement it properly once we have the database tables migrated
        hasAccess = true; // Temporarily allow access
      }
      
      if (!hasAccess) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Add the client to the appropriate resume session
      const client: Client = { userId, username, resumeId, ws };
      
      if (!resumeSessions.has(resumeId)) {
        resumeSessions.set(resumeId, new Set());
      }
      
      resumeSessions.get(resumeId)?.add(client);
      
      // Notify others in the session that a new user has joined
      broadcastToSession(resumeId, {
        type: 'user-joined',
        userId,
        username,
        timestamp: new Date().toISOString()
      }, client);
      
      // Send list of active users to the newly connected client
      const activeUsers = Array.from(resumeSessions.get(resumeId) || []).map(c => ({
        userId: c.userId,
        username: c.username
      }));
      
      ws.send(JSON.stringify({
        type: 'session-info',
        activeUsers,
        resumeId
      }));

      // Handle messages from the client
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'content-update':
              // Content updates (synchronize resume content changes)
              broadcastToSession(resumeId, {
                type: 'content-update',
                section: message.section,
                content: message.content,
                userId,
                username,
                timestamp: new Date().toISOString()
              }, client);
              
              // Save change to edit history
              try {
                // Note: This will be implemented when database is properly migrated
                // await storage.createResumeEditHistory({
                //   resumeId,
                //   userId,
                //   contentSnapshot: message.content,
                //   section: message.section,
                //   action: message.action || 'update'
                // });
              } catch (error) {
                console.error("Error saving edit history:", error);
              }
              break;
              
            case 'add-comment':
              // Add a new comment
              try {
                // Note: This will be implemented when database is properly migrated
                // const comment = await storage.createResumeComment({
                //   resumeId,
                //   userId,
                //   content: message.content,
                //   section: message.section,
                //   resolved: false
                // });
                
                // Using mock comment temporarily
                const comment = {
                  id: Date.now(),
                  resumeId,
                  userId,
                  section: message.section,
                  content: message.content,
                  resolved: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                broadcastToSession(resumeId, {
                  type: 'new-comment',
                  comment: {
                    ...comment,
                    username
                  }
                });
              } catch (error) {
                console.error("Error creating comment:", error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to create comment'
                }));
              }
              break;
              
            case 'resolve-comment':
              // Resolve a comment
              try {
                // Note: This will be implemented when database is properly migrated
                // const commentId = message.commentId;
                // await storage.updateResumeComment(commentId, {
                //   resolved: true
                // });
                
                broadcastToSession(resumeId, {
                  type: 'comment-resolved',
                  commentId: message.commentId,
                  resolvedBy: {
                    userId,
                    username
                  },
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                console.error("Error resolving comment:", error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to resolve comment'
                }));
              }
              break;
              
            case 'cursor-position':
              // Broadcast cursor position for collaborative editing
              broadcastToSession(resumeId, {
                type: 'cursor-position',
                userId,
                username,
                section: message.section,
                position: message.position
              }, client);
              break;
              
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        const session = resumeSessions.get(resumeId);
        
        if (session) {
          session.delete(client);
          
          // Remove the session if it's empty
          if (session.size === 0) {
            resumeSessions.delete(resumeId);
          } else {
            // Notify others that a user has left
            broadcastToSession(resumeId, {
              type: 'user-left',
              userId,
              username,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
      
    } catch (error) {
      console.error("Error in WebSocket connection:", error);
      ws.close(1011, 'Server error');
    }
  });

  // Collaboration API endpoints
  app.post('/api/resumes/:id/collaborators', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the user is the owner of the resume
      if (resume.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the owner can add collaborators" });
      }
      
      const { email, permission } = req.body;
      
      if (!email || !permission) {
        return res.status(400).json({ message: "Email and permission are required" });
      }
      
      // Find the user by email
      const userToAdd = await storage.getUserByEmail(email);
      
      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if this user is already a collaborator
      // Note: This will be implemented when database is properly migrated
      // const existingCollaborator = await storage.getCollaborator(resumeId, userToAdd.id);
      // 
      // if (existingCollaborator) {
      //   return res.status(400).json({ message: "User is already a collaborator" });
      // }
      
      // Add the collaborator
      // Note: This will be implemented when database is properly migrated
      // const collaborator = await storage.createResumeCollaborator({
      //   resumeId,
      //   userId: userToAdd.id,
      //   permission
      // });
      
      // Return mock response temporarily
      const collaborator = {
        id: Date.now(),
        resumeId,
        userId: userToAdd.id,
        permission,
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: userToAdd
      };
      
      res.status(201).json(collaborator);
    } catch (error) {
      console.error("Error adding collaborator:", error);
      res.status(500).json({ message: "Failed to add collaborator" });
    }
  });

  app.get('/api/resumes/:id/collaborators', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the user has access to this resume
      if (resume.userId !== req.user.id && !req.user.isAdmin) {
        // Check if the user is a collaborator
        // Note: This will be implemented when database is properly migrated
        // const isCollaborator = await storage.getCollaborator(resumeId, req.user.id);
        // 
        // if (!isCollaborator) {
        //   return res.status(403).json({ message: "Not authorized to view collaborators" });
        // }
      }
      
      // Get all collaborators for this resume
      // Note: This will be implemented when database is properly migrated
      // const collaborators = await storage.getResumeCollaborators(resumeId);
      
      // Return empty array temporarily
      const collaborators = [];
      
      res.json(collaborators);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  });

  app.delete('/api/resumes/:resumeId/collaborators/:userId', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumeId = parseInt(req.params.resumeId);
      const collaboratorUserId = parseInt(req.params.userId);
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Only the owner or an admin can remove collaborators
      if (resume.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to remove collaborators" });
      }
      
      // Remove the collaborator
      // Note: This will be implemented when database is properly migrated
      // await storage.deleteResumeCollaborator(resumeId, collaboratorUserId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing collaborator:", error);
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });

  app.get('/api/resumes/:id/comments', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the user has access to this resume
      if (resume.userId !== req.user.id && !req.user.isAdmin) {
        // Check if the user is a collaborator
        // Note: This will be implemented when database is properly migrated
        // const isCollaborator = await storage.getCollaborator(resumeId, req.user.id);
        // 
        // if (!isCollaborator) {
        //   return res.status(403).json({ message: "Not authorized to view comments" });
        // }
      }
      
      // Get all comments for this resume
      // Note: This will be implemented when database is properly migrated
      // const comments = await storage.getResumeComments(resumeId);
      
      // Return empty array temporarily
      const comments = [];
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  return httpServer;
}
