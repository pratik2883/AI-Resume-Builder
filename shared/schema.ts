import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
}));

export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export const userSelectSchema = createSelectSchema(users);
export type User = z.infer<typeof userSelectSchema>;

// API Keys
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  provider: text("provider").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  key: (schema) => schema.min(10, "Key is required"),
  provider: (schema) => schema.min(2, "Provider is required"),
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export const apiKeySelectSchema = createSelectSchema(apiKeys);
export type ApiKey = z.infer<typeof apiKeySelectSchema>;

// Resume Templates
export const resumeTemplates = pgTable("resume_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail").notNull(),
  htmlTemplate: text("html_template").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResumeTemplateSchema = createInsertSchema(resumeTemplates, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  description: (schema) => schema.min(2, "Description is required"),
  thumbnail: (schema) => schema.min(2, "Thumbnail URL is required"),
  htmlTemplate: (schema) => schema.min(2, "HTML template is required"),
});

export type InsertResumeTemplate = z.infer<typeof insertResumeTemplateSchema>;
export const resumeTemplateSelectSchema = createSelectSchema(resumeTemplates);
export type ResumeTemplate = z.infer<typeof resumeTemplateSelectSchema>;

// Resumes Table
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => resumeTemplates.id).notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  template: one(resumeTemplates, { fields: [resumes.templateId], references: [resumeTemplates.id] }),
}));

export const insertResumeSchema = createInsertSchema(resumes, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export type InsertResume = z.infer<typeof insertResumeSchema>;
export const resumeSelectSchema = createSelectSchema(resumes);
export type Resume = z.infer<typeof resumeSelectSchema>;

// Validation schemas for resume content
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
});

export const educationItemSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const experienceItemSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
});

export const skillItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Skill name is required"),
  level: z.number().min(0).max(5).optional(),
});

export const projectItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const resumeContentSchema = z.object({
  personalInfo: personalInfoSchema,
  education: z.array(educationItemSchema).optional(),
  experience: z.array(experienceItemSchema).optional(),
  skills: z.array(skillItemSchema).optional(),
  projects: z.array(projectItemSchema).optional(),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;

// Resume Collaborators
export const resumeCollaborators = pgTable("resume_collaborators", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").references(() => resumes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  permission: text("permission").notNull(), // 'view', 'edit', 'comment'
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumeCollaboratorsRelations = relations(resumeCollaborators, ({ one }) => ({
  resume: one(resumes, { fields: [resumeCollaborators.resumeId], references: [resumes.id] }),
  user: one(users, { fields: [resumeCollaborators.userId], references: [users.id] }),
}));

export const insertResumeCollaboratorSchema = createInsertSchema(resumeCollaborators, {
  permission: (schema) => schema.refine(
    val => ['view', 'edit', 'comment'].includes(val),
    "Permission must be 'view', 'edit', or 'comment'"
  ),
});

export type InsertResumeCollaborator = z.infer<typeof insertResumeCollaboratorSchema>;
export const resumeCollaboratorSelectSchema = createSelectSchema(resumeCollaborators);
export type ResumeCollaborator = z.infer<typeof resumeCollaboratorSelectSchema>;

// Resume Comments
export const resumeComments = pgTable("resume_comments", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").references(() => resumes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  section: text("section").notNull(), // Which section of the resume (e.g., 'personalInfo', 'education.0', etc.)
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumeCommentsRelations = relations(resumeComments, ({ one }) => ({
  resume: one(resumes, { fields: [resumeComments.resumeId], references: [resumes.id] }),
  user: one(users, { fields: [resumeComments.userId], references: [users.id] }),
}));

export const insertResumeCommentSchema = createInsertSchema(resumeComments, {
  content: (schema) => schema.min(1, "Comment content cannot be empty"),
});

export type InsertResumeComment = z.infer<typeof insertResumeCommentSchema>;
export const resumeCommentSelectSchema = createSelectSchema(resumeComments);
export type ResumeComment = z.infer<typeof resumeCommentSelectSchema>;

// Resume Edit History
export const resumeEditHistory = pgTable("resume_edit_history", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").references(() => resumes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentSnapshot: jsonb("content_snapshot").notNull(),
  section: text("section").notNull(), // Which section was edited
  action: text("action").notNull(), // 'add', 'update', 'delete'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumeEditHistoryRelations = relations(resumeEditHistory, ({ one }) => ({
  resume: one(resumes, { fields: [resumeEditHistory.resumeId], references: [resumes.id] }),
  user: one(users, { fields: [resumeEditHistory.userId], references: [users.id] }),
}));

export const insertResumeEditHistorySchema = createInsertSchema(resumeEditHistory, {
  action: (schema) => schema.refine(
    val => ['add', 'update', 'delete'].includes(val),
    "Action must be 'add', 'update', or 'delete'"
  ),
});

export type InsertResumeEditHistory = z.infer<typeof insertResumeEditHistorySchema>;
export const resumeEditHistorySelectSchema = createSelectSchema(resumeEditHistory);
export type ResumeEditHistory = z.infer<typeof resumeEditHistorySelectSchema>;
