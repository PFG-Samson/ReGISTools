import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
  geometry,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const assetStatusEnum = pgEnum('asset_status', ['active', 'inactive', 'maintenance', 'disposed']);
export const assetCategoryEnum = pgEnum('asset_category', ['equipment', 'vehicle', 'it_equipment', 'furniture', 'building', 'infrastructure']);
export const staffStatusEnum = pgEnum('staff_status', ['active', 'inactive', 'on_leave']);
export const workflowStatusEnum = pgEnum('workflow_status', ['pending', 'approved', 'rejected', 'completed']);
export const workflowTypeEnum = pgEnum('workflow_type', ['purchase', 'transfer', 'disposal', 'maintenance']);
export const documentTypeEnum = pgEnum('document_type', ['contract', 'invoice', 'manual', 'certificate', 'report', 'other']);

// Assets table with PostGIS geometry
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`concat('AST-', to_char(nextval('asset_seq'), 'FM0000'))`),
  name: text("name").notNull(),
  description: text("description"),
  category: assetCategoryEnum("category").notNull(),
  serialNumber: varchar("serial_number"),
  status: assetStatusEnum("status").default('active'),
  conditionScore: integer("condition_score").default(100),
  purchaseDate: timestamp("purchase_date"),
  purchaseValue: decimal("purchase_value", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  warrantyExpiry: timestamp("warranty_expiry"),
  custodianId: varchar("custodian_id").references(() => users.id),
  location: geometry("location", { type: "geometry", srid: 4326 }),
  address: text("address"),
  metadata: jsonb("metadata").default({}),
  tags: text("tags").array().default([]),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff table with office locations
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeId: varchar("employee_id").unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").unique(),
  phone: varchar("phone"),
  role: varchar("role").notNull(),
  department: varchar("department").notNull(),
  managerId: varchar("manager_id").references(() => staff.id),
  status: staffStatusEnum("status").default('active'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  officeLocation: geometry("office_location", { type: "geometry", srid: 4326 }),
  officeAddress: text("office_address"),
  certifications: text("certifications").array().default([]),
  skills: text("skills").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`concat('DOC-', to_char(nextval('document_seq'), 'FM0000'))`),
  title: text("title").notNull(),
  description: text("description"),
  type: documentTypeEnum("type").notNull(),
  filename: varchar("filename").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  filePath: text("file_path").notNull(),
  linkedEntityType: varchar("linked_entity_type"), // 'asset', 'staff', 'department'
  linkedEntityId: varchar("linked_entity_id"),
  retentionPolicy: varchar("retention_policy"),
  retentionExpiry: timestamp("retention_expiry"),
  tags: text("tags").array().default([]),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflows table
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`concat('WFL-', to_char(nextval('workflow_seq'), 'FM0000'))`),
  type: workflowTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: workflowStatusEnum("status").default('pending'),
  priority: varchar("priority").default('medium'),
  requestedBy: varchar("requested_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  assetId: varchar("asset_id").references(() => assets.id),
  relatedData: jsonb("related_data").default({}),
  approvalThreshold: decimal("approval_threshold", { precision: 12, scale: 2 }),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work Orders table
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`concat('WO-', to_char(nextval('work_order_seq'), 'FM0000'))`),
  assetId: varchar("asset_id").references(() => assets.id),
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // 'maintenance', 'repair', 'inspection'
  priority: varchar("priority").default('medium'),
  status: varchar("status").default('open'),
  assignedTo: varchar("assigned_to").references(() => staff.id),
  createdBy: varchar("created_by").references(() => users.id),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  notes: text("notes"),
  attachments: text("attachments").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs table (immutable)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type").notNull(), // 'asset', 'staff', 'document', etc.
  entityId: varchar("entity_id").notNull(),
  action: varchar("action").notNull(), // 'create', 'update', 'delete'
  userId: varchar("user_id").references(() => users.id),
  changeSummary: jsonb("change_summary"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdAssets: many(assets, { relationName: "createdAssets" }),
  custodianAssets: many(assets, { relationName: "custodianAssets" }),
  uploadedDocuments: many(documents),
  requestedWorkflows: many(workflows, { relationName: "requestedWorkflows" }),
  assignedWorkflows: many(workflows, { relationName: "assignedWorkflows" }),
  auditLogs: many(auditLogs),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  createdBy: one(users, { 
    fields: [assets.createdBy], 
    references: [users.id],
    relationName: "createdAssets"
  }),
  custodian: one(users, { 
    fields: [assets.custodianId], 
    references: [users.id],
    relationName: "custodianAssets"
  }),
  workOrders: many(workOrders),
  workflows: many(workflows),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, { fields: [staff.userId], references: [users.id] }),
  manager: one(staff, { fields: [staff.managerId], references: [staff.id], relationName: "manager" }),
  reports: many(staff, { relationName: "manager" }),
  workOrders: many(workOrders),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, { fields: [documents.uploadedBy], references: [users.id] }),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
  requestedBy: one(users, { 
    fields: [workflows.requestedBy], 
    references: [users.id],
    relationName: "requestedWorkflows"
  }),
  assignedTo: one(users, { 
    fields: [workflows.assignedTo], 
    references: [users.id],
    relationName: "assignedWorkflows"
  }),
  asset: one(assets, { fields: [workflows.assetId], references: [assets.id] }),
}));

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  asset: one(assets, { fields: [workOrders.assetId], references: [assets.id] }),
  assignedTo: one(staff, { fields: [workOrders.assignedTo], references: [staff.id] }),
  createdBy: one(users, { fields: [workOrders.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// Create sequences
export const assetSequence = sql`CREATE SEQUENCE IF NOT EXISTS asset_seq START 1000`;
export const documentSequence = sql`CREATE SEQUENCE IF NOT EXISTS document_seq START 1000`;
export const workflowSequence = sql`CREATE SEQUENCE IF NOT EXISTS workflow_seq START 1000`;
export const workOrderSequence = sql`CREATE SEQUENCE IF NOT EXISTS work_order_seq START 1000`;

// Insert schemas
export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
