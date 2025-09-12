import {
  users,
  assets,
  staff,
  documents,
  workflows,
  workOrders,
  auditLogs,
  type User,
  type UpsertUser,
  type Asset,
  type InsertAsset,
  type Staff,
  type InsertStaff,
  type Document,
  type InsertDocument,
  type Workflow,
  type InsertWorkflow,
  type WorkOrder,
  type InsertWorkOrder,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, like, and, or, sql } from "drizzle-orm";

// Spatial geometry utility functions for PostGIS
export const spatialUtils = {
  // Convert GeoJSON to PostGIS geometry
  geoJsonToGeometry: (geoJson: any) => {
    if (!geoJson || typeof geoJson !== 'object') return null;
    return sql`ST_GeomFromGeoJSON(${JSON.stringify(geoJson)})`;
  },

  // Convert coordinate pair to PostGIS point
  pointToGeometry: (longitude: number, latitude: number) => {
    return sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  },

  // Convert PostGIS geometry to GeoJSON (for querying)
  geometryToGeoJson: (columnName: string) => {
    return sql`ST_AsGeoJSON(${sql.raw(columnName)})::json`;
  },

  // Convert PostGIS geometry to coordinate pair
  geometryToCoords: (columnName: string) => {
    return sql`json_build_object('lng', ST_X(${sql.raw(columnName)}), 'lat', ST_Y(${sql.raw(columnName)}))`;
  },

  // Find items within radius (in meters)
  withinDistance: (columnName: string, longitude: number, latitude: number, radiusMeters: number) => {
    return sql`ST_DWithin(${sql.raw(columnName)}::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${radiusMeters})`;
  }
};

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Asset operations
  getAssets(limit?: number, offset?: number, search?: string): Promise<{ assets: Asset[]; total: number }>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;

  // Staff operations
  getStaffMembers(limit?: number, offset?: number, search?: string): Promise<{ staff: Staff[]; total: number }>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaffMember(staff: InsertStaff): Promise<Staff>;
  updateStaffMember(id: string, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaffMember(id: string): Promise<void>;

  // Document operations
  getDocuments(limit?: number, offset?: number, search?: string): Promise<{ documents: Document[]; total: number }>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Workflow operations
  getWorkflows(limit?: number, offset?: number, status?: string): Promise<{ workflows: Workflow[]; total: number }>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<void>;

  // Work Order operations
  getWorkOrders(limit?: number, offset?: number): Promise<{ workOrders: WorkOrder[]; total: number }>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder>;

  // Audit operations
  createAuditLog(log: {
    entityType: string;
    entityId: string;
    action: string;
    userId: string;
    changeSummary?: any;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
  getAuditLogs(limit?: number, offset?: number): Promise<{ logs: AuditLog[]; total: number }>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalAssets: number;
    activeStaff: number;
    totalDocuments: number;
    pendingApprovals: number;
  }>;

  // Search operations
  searchGlobal(query: string): Promise<{
    assets: Asset[];
    staff: Staff[];
    documents: Document[];
  }>;

  // Spatial operations
  getAssetsNearLocation(longitude: number, latitude: number, radiusMeters: number): Promise<Asset[]>;
  getStaffNearLocation(longitude: number, latitude: number, radiusMeters: number): Promise<Staff[]>;
  updateAssetLocation(id: string, longitude: number, latitude: number): Promise<Asset>;
  updateStaffLocation(id: string, longitude: number, latitude: number): Promise<Staff>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Asset operations
  async getAssets(limit = 20, offset = 0, search?: string): Promise<{ assets: Asset[]; total: number }> {
    const conditions = search
      ? or(
          like(assets.name, `%${search}%`),
          like(assets.description, `%${search}%`),
          like(assets.serialNumber, `%${search}%`)
        )
      : undefined;

    const [assetsList, totalCount] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(conditions)
        .orderBy(desc(assets.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(assets)
        .where(conditions)
        .then(result => result[0].count)
    ]);

    return { assets: assetsList, total: totalCount };
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset;
  }

  async deleteAsset(id: string): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Staff operations
  async getStaffMembers(limit = 20, offset = 0, search?: string): Promise<{ staff: Staff[]; total: number }> {
    const conditions = search
      ? or(
          like(staff.firstName, `%${search}%`),
          like(staff.lastName, `%${search}%`),
          like(staff.email, `%${search}%`),
          like(staff.role, `%${search}%`)
        )
      : undefined;

    const [staffList, totalCount] = await Promise.all([
      db
        .select()
        .from(staff)
        .where(conditions)
        .orderBy(desc(staff.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(staff)
        .where(conditions)
        .then(result => result[0].count)
    ]);

    return { staff: staffList as Staff[], total: totalCount };
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember as Staff | undefined;
  }

  async createStaffMember(staffData: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff as Staff;
  }

  async updateStaffMember(id: string, staffData: Partial<InsertStaff>): Promise<Staff> {
    const [updatedStaff] = await db
      .update(staff)
      .set({ ...staffData, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return updatedStaff as Staff;
  }

  async deleteStaffMember(id: string): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // Document operations
  async getDocuments(limit = 20, offset = 0, search?: string): Promise<{ documents: Document[]; total: number }> {
    const conditions = search
      ? or(
          like(documents.title, `%${search}%`),
          like(documents.description, `%${search}%`),
          like(documents.filename, `%${search}%`)
        )
      : undefined;

    const [documentsList, totalCount] = await Promise.all([
      db
        .select()
        .from(documents)
        .where(conditions)
        .orderBy(desc(documents.uploadedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(documents)
        .where(conditions)
        .then(result => result[0].count)
    ]);

    return { documents: documentsList, total: totalCount };
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Workflow operations
  async getWorkflows(limit = 20, offset = 0, status?: string): Promise<{ workflows: Workflow[]; total: number }> {
    const conditions = status ? eq(workflows.status, status as any) : undefined;

    const [workflowsList, totalCount] = await Promise.all([
      db
        .select()
        .from(workflows)
        .where(conditions)
        .orderBy(desc(workflows.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(workflows)
        .where(conditions)
        .then(result => result[0].count)
    ]);

    return { workflows: workflowsList, total: totalCount };
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }

  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow> {
    const [updatedWorkflow] = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  // Work Order operations
  async getWorkOrders(limit = 20, offset = 0): Promise<{ workOrders: WorkOrder[]; total: number }> {
    const [workOrdersList, totalCount] = await Promise.all([
      db
        .select()
        .from(workOrders)
        .orderBy(desc(workOrders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(workOrders)
        .then(result => result[0].count)
    ]);

    return { workOrders: workOrdersList, total: totalCount };
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const [newWorkOrder] = await db.insert(workOrders).values(workOrder).returning();
    return newWorkOrder;
  }

  async updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set({ ...workOrder, updatedAt: new Date() })
      .where(eq(workOrders.id, id))
      .returning();
    return updatedWorkOrder;
  }

  // Audit operations
  async createAuditLog(log: {
    entityType: string;
    entityId: string;
    action: string;
    userId: string;
    changeSummary?: any;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(limit = 50, offset = 0): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, totalCount] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(auditLogs)
        .then(result => result[0].count)
    ]);

    return { logs, total: totalCount };
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalAssets: number;
    activeStaff: number;
    totalDocuments: number;
    pendingApprovals: number;
  }> {
    const [assetCount, staffCount, documentCount, workflowCount] = await Promise.all([
      db.select({ count: count() }).from(assets).then(result => result[0].count),
      db.select({ count: count() }).from(staff).where(eq(staff.status, 'active')).then(result => result[0].count),
      db.select({ count: count() }).from(documents).then(result => result[0].count),
      db.select({ count: count() }).from(workflows).where(eq(workflows.status, 'pending')).then(result => result[0].count),
    ]);

    return {
      totalAssets: assetCount,
      activeStaff: staffCount,
      totalDocuments: documentCount,
      pendingApprovals: workflowCount,
    };
  }

  // Search operations
  async searchGlobal(query: string): Promise<{
    assets: Asset[];
    staff: Staff[];
    documents: Document[];
  }> {
    const searchTerm = `%${query}%`;

    const [assetResults, staffResults, documentResults] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(
          or(
            like(assets.name, searchTerm),
            like(assets.description, searchTerm),
            like(assets.serialNumber, searchTerm)
          )
        )
        .limit(10),
      db
        .select()
        .from(staff)
        .where(
          or(
            like(staff.firstName, searchTerm),
            like(staff.lastName, searchTerm),
            like(staff.email, searchTerm),
            like(staff.role, searchTerm)
          )
        )
        .limit(10),
      db
        .select()
        .from(documents)
        .where(
          or(
            like(documents.title, searchTerm),
            like(documents.description, searchTerm),
            like(documents.filename, searchTerm)
          )
        )
        .limit(10),
    ]);

    return {
      assets: assetResults as Asset[],
      staff: staffResults as Staff[],
      documents: documentResults as Document[],
    };
  }

  // Spatial operations
  async getAssetsNearLocation(longitude: number, latitude: number, radiusMeters: number): Promise<Asset[]> {
    const nearbyAssets = await db
      .select({
        id: assets.id,
        name: assets.name,
        description: assets.description,
        category: assets.category,
        serialNumber: assets.serialNumber,
        status: assets.status,
        conditionScore: assets.conditionScore,
        purchaseDate: assets.purchaseDate,
        purchaseValue: assets.purchaseValue,
        currentValue: assets.currentValue,
        warrantyExpiry: assets.warrantyExpiry,
        custodianId: assets.custodianId,
        location: spatialUtils.geometryToGeoJson('location'),
        address: assets.address,
        metadata: assets.metadata,
        tags: assets.tags,
        createdBy: assets.createdBy,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        distance: sql`ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography)`.as('distance')
      })
      .from(assets)
      .where(
        and(
          sql`location IS NOT NULL`,
          spatialUtils.withinDistance('location', longitude, latitude, radiusMeters)
        )
      )
      .orderBy(sql`distance`);

    return nearbyAssets as any;
  }

  async getStaffNearLocation(longitude: number, latitude: number, radiusMeters: number): Promise<Staff[]> {
    const nearbyStaff = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        employeeId: staff.employeeId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department,
        managerId: staff.managerId,
        status: staff.status,
        startDate: staff.startDate,
        endDate: staff.endDate,
        officeLocation: spatialUtils.geometryToGeoJson('office_location'),
        officeAddress: staff.officeAddress,
        certifications: staff.certifications,
        skills: staff.skills,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        distance: sql`ST_Distance(office_location::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography)`.as('distance')
      })
      .from(staff)
      .where(
        and(
          sql`office_location IS NOT NULL`,
          spatialUtils.withinDistance('office_location', longitude, latitude, radiusMeters)
        )
      )
      .orderBy(sql`distance`);

    return nearbyStaff as any;
  }

  async updateAssetLocation(id: string, longitude: number, latitude: number): Promise<Asset> {
    const [updatedAsset] = await db
      .update(assets)
      .set({
        location: spatialUtils.pointToGeometry(longitude, latitude),
        updatedAt: new Date()
      })
      .where(eq(assets.id, id))
      .returning();

    return updatedAsset as Asset;
  }

  async updateStaffLocation(id: string, longitude: number, latitude: number): Promise<Staff> {
    const [updatedStaff] = await db
      .update(staff)
      .set({
        officeLocation: spatialUtils.pointToGeometry(longitude, latitude),
        updatedAt: new Date()
      })
      .where(eq(staff.id, id))
      .returning();

    return updatedStaff as Staff;
  }
}

export const storage = new DatabaseStorage();
