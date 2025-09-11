import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Workflows() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch workflows with filters
  const { data: workflowsData, isLoading } = useQuery({
    queryKey: [
      "/api/workflows", 
      { 
        limit, 
        offset: page * limit, 
        status: statusFilter === "all" ? undefined : statusFilter 
      }
    ],
    retry: false,
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/workflows/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (workflow: any) => {
    updateWorkflowMutation.mutate({
      id: workflow.id,
      data: {
        status: 'approved',
        completedDate: new Date().toISOString()
      }
    });
  };

  const handleReject = (workflow: any) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      updateWorkflowMutation.mutate({
        id: workflow.id,
        data: {
          status: 'rejected',
          comments: reason,
          completedDate: new Date().toISOString()
        }
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'purchase': return 'fa-shopping-cart';
      case 'transfer': return 'fa-exchange-alt';
      case 'disposal': return 'fa-trash';
      case 'maintenance': return 'fa-wrench';
      default: return 'fa-clipboard-list';
    }
  };

  const getWorkflowColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-600 bg-green-100';
      case 'transfer': return 'text-blue-600 bg-blue-100';
      case 'disposal': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWorkflows = workflowsData?.workflows || [];
  const pendingWorkflows = filteredWorkflows.filter((w: any) => w.status === 'pending');
  const completedWorkflows = filteredWorkflows.filter((w: any) => ['approved', 'rejected', 'completed'].includes(w.status));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Workflows & Approvals</h2>
              <p className="text-sm text-muted-foreground">Manage approval processes and workflow status</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {pendingWorkflows.length} Pending
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {workflowsData?.total || 0} Total
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleSearch} className="flex items-center space-x-4">
                  <div className="flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Search workflows by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-workflows"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="secondary" data-testid="button-search">
                    <i className="fas fa-search mr-2"></i>
                    Search
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPage(0);
                    }}
                    data-testid="button-clear-search"
                  >
                    Clear
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Workflows Tabs */}
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending Approvals ({pendingWorkflows.length})
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed">
                  Completed ({completedWorkflows.length})
                </TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all">
                  All Workflows ({filteredWorkflows.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading workflows...</p>
                  </div>
                ) : pendingWorkflows.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingWorkflows.map((workflow: any) => (
                      <Card key={workflow.id} className="hover:shadow-md transition-shadow" data-testid={`card-workflow-${workflow.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`rounded-lg p-3 ${getWorkflowColor(workflow.type)}`}>
                              <i className={`fas ${getWorkflowIcon(workflow.type)} text-xl`}></i>
                            </div>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">{workflow.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {workflow.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground capitalize">
                                {workflow.type}
                              </span>
                              <span className="font-mono text-primary">{workflow.id}</span>
                            </div>

                            {workflow.estimatedCost && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Estimated Cost: </span>
                                <span className="font-medium">${parseFloat(workflow.estimatedCost).toLocaleString()}</span>
                              </div>
                            )}

                            {workflow.assetId && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Asset: </span>
                                <span className="font-mono text-primary">{workflow.assetId}</span>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              Created {new Date(workflow.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex space-x-2 mt-4">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(workflow)}
                              disabled={updateWorkflowMutation.isPending}
                              data-testid={`button-approve-workflow-${workflow.id}`}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="flex-1"
                              onClick={() => handleReject(workflow)}
                              disabled={updateWorkflowMutation.isPending}
                              data-testid={`button-reject-workflow-${workflow.id}`}
                            >
                              <i className="fas fa-times mr-1"></i>
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-muted-foreground">
                        <i className="fas fa-clipboard-check text-6xl mb-4 block"></i>
                        <p className="text-lg font-medium">No pending workflows</p>
                        <p className="text-sm">All workflows are up to date</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedWorkflows.length > 0 ? (
                  <div className="space-y-4">
                    {completedWorkflows.map((workflow: any) => (
                      <Card key={workflow.id} data-testid={`card-completed-workflow-${workflow.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`rounded-lg p-2 ${getWorkflowColor(workflow.type)}`}>
                                <i className={`fas ${getWorkflowIcon(workflow.type)}`}></i>
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-semibold text-foreground">{workflow.title}</h3>
                                <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>Type: {workflow.type}</span>
                                  <span>ID: {workflow.id}</span>
                                  {workflow.estimatedCost && (
                                    <span>Cost: ${parseFloat(workflow.estimatedCost).toLocaleString()}</span>
                                  )}
                                </div>
                                {workflow.comments && (
                                  <p className="text-sm text-muted-foreground italic">
                                    Comment: {workflow.comments}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Completed {new Date(workflow.completedDate || workflow.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-muted-foreground">
                        <i className="fas fa-history text-6xl mb-4 block"></i>
                        <p className="text-lg font-medium">No completed workflows</p>
                        <p className="text-sm">Completed workflows will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="all">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading workflows...</p>
                  </div>
                ) : filteredWorkflows.length > 0 ? (
                  <div className="space-y-4">
                    {filteredWorkflows.map((workflow: any) => (
                      <Card key={workflow.id} data-testid={`card-all-workflow-${workflow.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`rounded-lg p-2 ${getWorkflowColor(workflow.type)}`}>
                                <i className={`fas ${getWorkflowIcon(workflow.type)}`}></i>
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-semibold text-foreground">{workflow.title}</h3>
                                <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>Type: {workflow.type}</span>
                                  <span>ID: {workflow.id}</span>
                                  {workflow.estimatedCost && (
                                    <span>Cost: ${parseFloat(workflow.estimatedCost).toLocaleString()}</span>
                                  )}
                                  <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(workflow.status)}>
                                {workflow.status}
                              </Badge>
                              {workflow.status === 'pending' && (
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(workflow)}
                                    disabled={updateWorkflowMutation.isPending}
                                    data-testid={`button-approve-workflow-${workflow.id}`}
                                  >
                                    <i className="fas fa-check"></i>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleReject(workflow)}
                                    disabled={updateWorkflowMutation.isPending}
                                    data-testid={`button-reject-workflow-${workflow.id}`}
                                  >
                                    <i className="fas fa-times"></i>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination */}
                    {workflowsData?.total > limit && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {page * limit + 1} to {Math.min((page + 1) * limit, workflowsData.total)} of {workflowsData.total} workflows
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            data-testid="button-previous-page"
                          >
                            <i className="fas fa-chevron-left mr-1"></i>
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {page + 1} of {Math.ceil(workflowsData.total / limit)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={(page + 1) * limit >= workflowsData.total}
                            data-testid="button-next-page"
                          >
                            Next
                            <i className="fas fa-chevron-right ml-1"></i>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-muted-foreground">
                        <i className="fas fa-project-diagram text-6xl mb-4 block"></i>
                        <p className="text-lg font-medium">No workflows found</p>
                        <p className="text-sm">
                          {searchTerm || statusFilter !== "all" ? 'Try adjusting your filters' : 'Workflows will appear here when created'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
