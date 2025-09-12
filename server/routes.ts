import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertAssetSchema, 
  insertStaffSchema, 
  insertDocumentSchema, 
  insertWorkflowSchema,
  insertWorkOrderSchema 
} from "@shared/schema";
import { z } from "zod";

// Extend Request type to include user from Replit Auth
interface AuthRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Helper function to create audit log
  const createAuditLog = async (
    entityType: string,
    entityId: string,
    action: string,
    req: AuthRequest,
    oldValues?: any,
    newValues?: any
  ) => {
    if (req.user?.claims?.sub) {
      await storage.createAuditLog({
        entityType,
        entityId,
        action,
        userId: req.user.claims.sub,
        changeSummary: { action, entityType, entityId },
        oldValues,
        newValues,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Global search
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchGlobal(q);
      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Spatial search endpoints
  app.get('/api/spatial/assets', isAuthenticated, async (req, res) => {
    try {
      const { lng, lat, radius } = req.query;
      if (!lng || !lat || !radius) {
        return res.status(400).json({ message: "longitude, latitude, and radius are required" });
      }
      
      const longitude = parseFloat(lng as string);
      const latitude = parseFloat(lat as string);
      const radiusMeters = parseFloat(radius as string);
      
      // Validate coordinates and radius bounds
      if (isNaN(longitude) || isNaN(latitude) || isNaN(radiusMeters)) {
        return res.status(400).json({ message: "Invalid coordinate or radius values" });
      }
      
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Longitude must be between -180 and 180" });
      }
      
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: "Latitude must be between -90 and 90" });
      }
      
      if (radiusMeters <= 0 || radiusMeters > 100000) {
        return res.status(400).json({ message: "Radius must be between 0 and 100,000 meters" });
      }
      
      const nearbyAssets = await storage.getAssetsNearLocation(longitude, latitude, radiusMeters);
      res.json(nearbyAssets);
    } catch (error) {
      console.error("Error finding nearby assets:", error);
      res.status(500).json({ message: "Failed to find nearby assets" });
    }
  });

  app.get('/api/spatial/staff', isAuthenticated, async (req, res) => {
    try {
      const { lng, lat, radius } = req.query;
      if (!lng || !lat || !radius) {
        return res.status(400).json({ message: "longitude, latitude, and radius are required" });
      }
      
      const longitude = parseFloat(lng as string);
      const latitude = parseFloat(lat as string);
      const radiusMeters = parseFloat(radius as string);
      
      // Validate coordinates and radius bounds
      if (isNaN(longitude) || isNaN(latitude) || isNaN(radiusMeters)) {
        return res.status(400).json({ message: "Invalid coordinate or radius values" });
      }
      
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Longitude must be between -180 and 180" });
      }
      
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: "Latitude must be between -90 and 90" });
      }
      
      if (radiusMeters <= 0 || radiusMeters > 100000) {
        return res.status(400).json({ message: "Radius must be between 0 and 100,000 meters" });
      }
      
      const nearbyStaff = await storage.getStaffNearLocation(longitude, latitude, radiusMeters);
      res.json(nearbyStaff);
    } catch (error) {
      console.error("Error finding nearby staff:", error);
      res.status(500).json({ message: "Failed to find nearby staff" });
    }
  });

  app.put('/api/assets/:id/location', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      // Validate request body with Zod
      const locationSchema = z.object({
        longitude: z.number().min(-180).max(180),
        latitude: z.number().min(-90).max(90)
      });
      
      const validatedData = locationSchema.parse(req.body);
      
      // Check if asset exists and user has permission
      const existingAsset = await storage.getAsset(req.params.id);
      if (!existingAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Basic authorization: user must be the custodian or creator of the asset
      const userId = authReq.user!.claims.sub;
      if (existingAsset.custodianId !== userId && existingAsset.createdBy !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this asset's location" });
      }
      
      const asset = await storage.updateAssetLocation(req.params.id, validatedData.longitude, validatedData.latitude);
      
      // Audit log the location update
      await createAuditLog('asset', req.params.id, 'location_update', authReq, 
        { location: existingAsset.location }, 
        { location: { longitude: validatedData.longitude, latitude: validatedData.latitude } }
      );
      
      res.json(asset);
    } catch (error) {
      console.error("Error updating asset location:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update asset location" });
    }
  });

  app.put('/api/staff/:id/location', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      // Validate request body with Zod
      const locationSchema = z.object({
        longitude: z.number().min(-180).max(180),
        latitude: z.number().min(-90).max(90)
      });
      
      const validatedData = locationSchema.parse(req.body);
      
      // Check if staff member exists and user has permission
      const existingStaff = await storage.getStaffMember(req.params.id);
      if (!existingStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Authorization: user can only update their own location or if they're a manager
      const userId = authReq.user!.claims.sub;
      if (existingStaff.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own office location" });
      }
      
      const staff = await storage.updateStaffLocation(req.params.id, validatedData.longitude, validatedData.latitude);
      
      // Audit log the location update
      await createAuditLog('staff', req.params.id, 'location_update', authReq, 
        { officeLocation: existingStaff.officeLocation }, 
        { officeLocation: { longitude: validatedData.longitude, latitude: validatedData.latitude } }
      );
      
      res.json(staff);
    } catch (error) {
      console.error("Error updating staff location:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update staff location" });
    }
  });

  // Asset routes
  app.get('/api/assets', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const result = await storage.getAssets(limit, offset, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get('/api/assets/:id', isAuthenticated, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  app.post('/api/assets', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertAssetSchema.parse({
        ...req.body,
        createdBy: authReq.user!.claims.sub,
      });
      
      const asset = await storage.createAsset(validatedData);
      await createAuditLog('asset', asset.id!, 'create', authReq, undefined, asset);
      
      res.status(201).json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.put('/api/assets/:id', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const oldAsset = await storage.getAsset(req.params.id);
      if (!oldAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const validatedData = insertAssetSchema.partial().parse(req.body);
      const updatedAsset = await storage.updateAsset(req.params.id, validatedData);
      
      await createAuditLog('asset', req.params.id, 'update', authReq, oldAsset, updatedAsset);
      
      res.json(updatedAsset);
    } catch (error) {
      console.error("Error updating asset:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete('/api/assets/:id', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      await storage.deleteAsset(req.params.id);
      await createAuditLog('asset', req.params.id, 'delete', authReq, asset, undefined);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Staff routes
  app.get('/api/staff', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const result = await storage.getStaffMembers(limit, offset, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get('/api/staff/:id', isAuthenticated, async (req, res) => {
    try {
      const staffMember = await storage.getStaffMember(req.params.id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffMember);
    } catch (error) {
      console.error("Error fetching staff member:", error);
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.post('/api/staff', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertStaffSchema.parse(req.body);
      const staffMember = await storage.createStaffMember(validatedData);
      
      await createAuditLog('staff', staffMember.id!, 'create', authReq, undefined, staffMember);
      
      res.status(201).json(staffMember);
    } catch (error) {
      console.error("Error creating staff member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put('/api/staff/:id', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const oldStaff = await storage.getStaffMember(req.params.id);
      if (!oldStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const validatedData = insertStaffSchema.partial().parse(req.body);
      const updatedStaff = await storage.updateStaffMember(req.params.id, validatedData);
      
      await createAuditLog('staff', req.params.id, 'update', authReq, oldStaff, updatedStaff);
      
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error updating staff member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete('/api/staff/:id', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const staffMember = await storage.getStaffMember(req.params.id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      await storage.deleteStaffMember(req.params.id);
      await createAuditLog('staff', req.params.id, 'delete', authReq, staffMember, undefined);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting staff member:", error);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const result = await storage.getDocuments(limit, offset, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        uploadedBy: authReq.user!.claims.sub,
      });
      
      const document = await storage.createDocument(validatedData);
      await createAuditLog('document', document.id!, 'create', authReq, undefined, document);
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Workflow routes
  app.get('/api/workflows', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      
      const result = await storage.getWorkflows(limit, offset, status);
      res.json(result);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.post('/api/workflows', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse({
        ...req.body,
        requestedBy: (req as AuthRequest).user!.claims.sub,
      });
      
      const workflow = await storage.createWorkflow(validatedData);
      await createAuditLog('workflow', workflow.id!, 'create', req as AuthRequest, undefined, workflow);
      
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put('/api/workflows/:id', isAuthenticated, async (req, res) => {
    try {
      const oldWorkflow = await storage.getWorkflow(req.params.id);
      if (!oldWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const validatedData = insertWorkflowSchema.partial().parse(req.body);
      const updatedWorkflow = await storage.updateWorkflow(req.params.id, validatedData);
      
      await createAuditLog('workflow', req.params.id, 'update', req as AuthRequest, oldWorkflow, updatedWorkflow);
      
      res.json(updatedWorkflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  // Audit routes
  app.get('/api/audit-logs', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getAuditLogs(limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Work Order routes
  app.get('/api/work-orders', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getWorkOrders(limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.post('/api/work-orders', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse({
        ...req.body,
        createdBy: (req as AuthRequest).user!.claims.sub,
      });
      
      const workOrder = await storage.createWorkOrder(validatedData);
      await createAuditLog('work_order', workOrder.id!, 'create', req as AuthRequest, undefined, workOrder);
      
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create work order" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
