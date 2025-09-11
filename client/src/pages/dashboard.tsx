import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import InteractiveMap from "@/components/map";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Dashboard stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Recent assets query
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["/api/assets"],
    retry: false,
  });

  // Recent staff query
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["/api/staff"],
    retry: false,
  });

  // Pending workflows query
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
    retry: false,
  });

  // Recent audit logs query
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/audit-logs"],
    retry: false,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">Asset & Records Management</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input 
                  type="text" 
                  placeholder="Search assets, staff, documents..." 
                  className="pl-10 w-96"
                  data-testid="input-global-search"
                />
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <div className="relative">
                  <i className="fas fa-bell text-lg"></i>
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats?.pendingApprovals || 0}
                  </span>
                </div>
              </Button>
              
              {/* User Menu */}
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                <div className="bg-secondary rounded-full w-8 h-8 flex items-center justify-center">
                  <i className="fas fa-user text-muted-foreground"></i>
                </div>
                <i className="fas fa-chevron-down text-sm"></i>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-assets">
                      {statsLoading ? "..." : (stats?.totalAssets || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <i className="fas fa-arrow-up mr-1"></i>
                      Active and tracked
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <i className="fas fa-box text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-active-staff">
                      {statsLoading ? "..." : (stats?.activeStaff || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <i className="fas fa-users mr-1"></i>
                      Currently employed
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <i className="fas fa-users text-green-600 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documents</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-documents">
                      {statsLoading ? "..." : (stats?.totalDocuments || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <i className="fas fa-file-alt mr-1"></i>
                      Stored securely
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3">
                    <i className="fas fa-file-alt text-orange-600 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-pending-approvals">
                      {statsLoading ? "..." : stats?.pendingApprovals || 0}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      {stats?.pendingApprovals > 0 ? "Requires attention" : "All current"}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-lg p-3">
                    <i className="fas fa-clock text-red-600 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <InteractiveMap />
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-between" 
                      data-testid="button-new-asset"
                    >
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-plus-circle"></i>
                        <span>New Asset</span>
                      </div>
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      className="w-full justify-between"
                      data-testid="button-add-staff"
                    >
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-user-plus"></i>
                        <span>Add Staff</span>
                      </div>
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      className="w-full justify-between"
                      data-testid="button-upload-document"
                    >
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-upload"></i>
                        <span>Upload Document</span>
                      </div>
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      className="w-full justify-between"
                      data-testid="button-generate-report"
                    >
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-file-export"></i>
                        <span>Generate Report</span>
                      </div>
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                    <Button variant="link" size="sm" data-testid="link-view-all-activity">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {auditLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : auditData?.logs?.length > 0 ? (
                      auditData.logs.slice(0, 3).map((log: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                          <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                            <i className={`fas fa-${log.action === 'create' ? 'plus' : log.action === 'update' ? 'edit' : 'trash'} text-green-600 text-sm`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.entityType}
                            </p>
                            <p className="text-sm text-muted-foreground">ID: {log.entityId}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Data Tables Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Assets Table */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Recent Assets</h3>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="text" 
                        placeholder="Filter assets..." 
                        className="w-32 h-8"
                        data-testid="input-filter-assets"
                      />
                      <Button size="sm" data-testid="button-view-all-assets">
                        View All
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Asset ID</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assetsLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          </td>
                        </tr>
                      ) : assetsData?.assets?.length > 0 ? (
                        assetsData.assets.slice(0, 5).map((asset: any) => (
                          <tr key={asset.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-asset-${asset.id}`}>
                            <td className="px-4 py-3 font-mono text-primary">{asset.id}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{asset.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{asset.category}</td>
                            <td className="px-4 py-3">
                              <Badge variant={asset.status === 'active' ? 'default' : asset.status === 'maintenance' ? 'secondary' : 'destructive'}>
                                {asset.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="ghost" data-testid={`button-edit-asset-${asset.id}`}>
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button size="sm" variant="ghost" data-testid={`button-view-asset-${asset.id}`}>
                                  <i className="fas fa-eye"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No assets found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Staff Directory Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Staff Directory</h3>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="text" 
                        placeholder="Find staff..." 
                        className="w-32 h-8"
                        data-testid="input-find-staff"
                      />
                      <Button size="sm" data-testid="button-view-all-staff">
                        View All
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {staffLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : staffData?.staff?.length > 0 ? (
                    staffData.staff.slice(0, 3).map((member: any) => (
                      <div key={member.id} className="p-4 hover:bg-muted/50 transition-colors" data-testid={`card-staff-${member.id}`}>
                        <div className="flex items-center space-x-4">
                          <div className="bg-secondary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-user text-muted-foreground"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground">{member.firstName} {member.lastName}</p>
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="ghost" data-testid={`button-edit-staff-${member.id}`}>
                                  <i className="fas fa-edit text-sm"></i>
                                </Button>
                                <Button size="sm" variant="ghost" data-testid={`button-view-staff-${member.id}`}>
                                  <i className="fas fa-eye text-sm"></i>
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-primary">{member.role}</p>
                            <p className="text-sm text-muted-foreground">{member.department}</p>
                            {member.officeAddress && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {member.officeAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No staff members found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow & Approval Section */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Pending Workflows & Approvals</h3>
                  <Button data-testid="button-manage-workflows">
                    Manage Workflows
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflowsLoading ? (
                    <div className="col-span-full text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : workflowsData?.workflows?.length > 0 ? (
                    workflowsData.workflows.filter((w: any) => w.status === 'pending').slice(0, 3).map((workflow: any) => (
                      <div key={workflow.id} className="border border-border rounded-lg p-4 bg-muted/30" data-testid={`card-workflow-${workflow.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-orange-100 rounded-lg p-2">
                            <i className={`fas fa-${workflow.type === 'purchase' ? 'shopping-cart' : workflow.type === 'transfer' ? 'exchange-alt' : 'trash'} text-orange-600`}></i>
                          </div>
                          <Badge variant="secondary">{workflow.status}</Badge>
                        </div>
                        <h4 className="font-medium text-foreground mb-1">{workflow.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {workflow.estimatedCost && `$${workflow.estimatedCost}`}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-workflow-${workflow.id}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1"
                            data-testid={`button-reject-workflow-${workflow.id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No pending workflows
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
