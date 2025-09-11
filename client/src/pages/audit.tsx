import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Audit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 50;

  // Fetch audit logs
  const { data: auditData, isLoading } = useQuery({
    queryKey: ["/api/audit-logs", { limit, offset: page * limit }],
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return 'fa-plus text-green-600';
      case 'update': return 'fa-edit text-blue-600';
      case 'delete': return 'fa-trash text-red-600';
      default: return 'fa-circle text-gray-600';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'asset': return 'fa-box';
      case 'staff': return 'fa-user';
      case 'document': return 'fa-file-alt';
      case 'workflow': return 'fa-project-diagram';
      case 'work_order': return 'fa-wrench';
      default: return 'fa-circle';
    }
  };

  // Filter logs based on search and filters
  const filteredLogs = auditData?.logs?.filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntityType = entityTypeFilter === "all" || log.entityType === entityTypeFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesEntityType && matchesAction;
  }) || [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Audit Logs</h2>
              <p className="text-sm text-muted-foreground">Track all system changes and user activities</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredLogs.length} Filtered
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {auditData?.total || 0} Total
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
                      placeholder="Search by entity ID, type, or action..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-audit"
                    />
                  </div>
                  
                  <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                    <SelectTrigger className="w-48" data-testid="select-entity-type-filter">
                      <SelectValue placeholder="Filter by entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entity Types</SelectItem>
                      <SelectItem value="asset">Assets</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="workflow">Workflows</SelectItem>
                      <SelectItem value="work_order">Work Orders</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-48" data-testid="select-action-filter">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
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
                      setEntityTypeFilter("all");
                      setActionFilter("all");
                      setPage(0);
                    }}
                    data-testid="button-clear-search"
                  >
                    Clear
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading audit logs...</p>
                  </div>
                ) : filteredLogs.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredLogs.map((log: any, index: number) => (
                      <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors" data-testid={`log-entry-${log.id}`}>
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                              <i className={`fas ${getActionIcon(log.action)} text-sm`}></i>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Badge className={getActionColor(log.action)}>
                                    {log.action}
                                  </Badge>
                                  <Badge variant="outline">
                                    <i className={`fas ${getEntityIcon(log.entityType)} mr-1`}></i>
                                    {log.entityType}
                                  </Badge>
                                  <span className="font-mono text-primary text-sm">{log.entityId}</span>
                                </div>
                                
                                <p className="text-sm text-foreground">
                                  {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.entityType} 
                                  <span className="font-mono text-primary ml-1">{log.entityId}</span>
                                </p>

                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>
                                    <i className="fas fa-user mr-1"></i>
                                    User ID: {log.userId}
                                  </span>
                                  <span>
                                    <i className="fas fa-clock mr-1"></i>
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                  {log.ipAddress && (
                                    <span>
                                      <i className="fas fa-globe mr-1"></i>
                                      {log.ipAddress}
                                    </span>
                                  )}
                                </div>

                                {log.changeSummary && Object.keys(log.changeSummary).length > 0 && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <p className="text-muted-foreground mb-1">Summary:</p>
                                    <pre className="text-foreground whitespace-pre-wrap">
                                      {JSON.stringify(log.changeSummary, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                      Previous Values
                                    </summary>
                                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                      <pre className="text-red-800 whitespace-pre-wrap">
                                        {JSON.stringify(log.oldValues, null, 2)}
                                      </pre>
                                    </div>
                                  </details>
                                )}

                                {log.newValues && Object.keys(log.newValues).length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                      New Values
                                    </summary>
                                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                      <pre className="text-green-800 whitespace-pre-wrap">
                                        {JSON.stringify(log.newValues, null, 2)}
                                      </pre>
                                    </div>
                                  </details>
                                )}
                              </div>
                              
                              <div className="text-xs text-muted-foreground font-mono">
                                #{log.id}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <i className="fas fa-history text-6xl mb-4 block"></i>
                      <p className="text-lg font-medium">No audit logs found</p>
                      <p className="text-sm">
                        {searchTerm || entityTypeFilter !== "all" || actionFilter !== "all" 
                          ? 'Try adjusting your search filters' 
                          : 'Audit logs will appear here as users make changes'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {auditData?.total > limit && (
                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {page * limit + 1} to {Math.min((page + 1) * limit, auditData.total)} of {auditData.total} log entries
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
                        Page {page + 1} of {Math.ceil(auditData.total / limit)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={(page + 1) * limit >= auditData.total}
                        data-testid="button-next-page"
                      >
                        Next
                        <i className="fas fa-chevron-right ml-1"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
