import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import StaffForm from "@/components/staff-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Staff() {
  const { toast } = useToast();
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch staff members
  const { data: staffData, isLoading } = useQuery({
    queryKey: ["/api/staff", { limit, offset: page * limit, search: searchTerm }],
    retry: false,
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/staff/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
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
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (staff: any) => {
    setSelectedStaff(staff);
    setShowStaffForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const handleNewStaff = () => {
    setSelectedStaff(null);
    setShowStaffForm(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Staff Directory</h2>
              <p className="text-sm text-muted-foreground">Manage organizational staff and hierarchy</p>
            </div>
            <Button onClick={handleNewStaff} data-testid="button-new-staff">
              <i className="fas fa-user-plus mr-2"></i>
              Add Staff
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Card>
            <CardContent className="p-0">
              {/* Search and Filters */}
              <div className="p-4 border-b border-border">
                <form onSubmit={handleSearch} className="flex items-center space-x-4">
                  <div className="flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Search staff by name, email, role, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-staff"
                    />
                  </div>
                  <Button type="submit" variant="secondary" data-testid="button-search">
                    <i className="fas fa-search mr-2"></i>
                    Search
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setPage(0);
                    }}
                    data-testid="button-clear-search"
                  >
                    Clear
                  </Button>
                </form>
              </div>

              {/* Staff Grid */}
              <div className="p-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading staff members...</p>
                  </div>
                ) : staffData?.staff?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staffData.staff.map((member: any) => (
                      <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`card-staff-${member.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="bg-secondary rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-user text-muted-foreground text-lg"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {member.firstName} {member.lastName}
                                  </h3>
                                  <p className="text-sm text-primary font-medium">{member.role}</p>
                                  <p className="text-sm text-muted-foreground">{member.department}</p>
                                  {member.email && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{member.email}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleEdit(member)}
                                    data-testid={`button-edit-staff-${member.id}`}
                                  >
                                    <i className="fas fa-edit text-xs"></i>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleDelete(member.id)}
                                    disabled={deleteStaffMutation.isPending}
                                    data-testid={`button-delete-staff-${member.id}`}
                                  >
                                    <i className="fas fa-trash text-xs"></i>
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex items-center justify-between">
                                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                  {member.status}
                                </Badge>
                                {member.employeeId && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {member.employeeId}
                                  </span>
                                )}
                              </div>

                              {member.officeAddress && (
                                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  <span className="truncate">{member.officeAddress}</span>
                                </div>
                              )}

                              {member.skills && member.skills.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {member.skills.slice(0, 3).map((skill: string, index: number) => (
                                      <span 
                                        key={index}
                                        className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {member.skills.length > 3 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{member.skills.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <i className="fas fa-users text-6xl mb-4 block"></i>
                      <p className="text-lg font-medium">No staff members found</p>
                      <p className="text-sm">
                        {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first staff member'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleNewStaff} className="mt-4" data-testid="button-create-first-staff">
                          <i className="fas fa-user-plus mr-2"></i>
                          Add Staff Member
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {staffData?.total > limit && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {page * limit + 1} to {Math.min((page + 1) * limit, staffData.total)} of {staffData.total} staff members
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
                        Page {page + 1} of {Math.ceil(staffData.total / limit)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={(page + 1) * limit >= staffData.total}
                        data-testid="button-next-page"
                      >
                        Next
                        <i className="fas fa-chevron-right ml-1"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Staff Form Modal */}
      <Dialog open={showStaffForm} onOpenChange={setShowStaffForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <StaffForm 
            staff={selectedStaff}
            onSuccess={() => {
              setShowStaffForm(false);
              setSelectedStaff(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
