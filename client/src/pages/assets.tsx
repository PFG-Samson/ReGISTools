import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import AssetForm from "@/components/asset-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Assets() {
  const { toast } = useToast();
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch assets
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["/api/assets", { limit, offset: page * limit, search: searchTerm }],
    retry: false,
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
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
        description: "Failed to delete asset",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setShowAssetForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleNewAsset = () => {
    setSelectedAsset(null);
    setShowAssetForm(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page when searching
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Assets</h2>
              <p className="text-sm text-muted-foreground">Manage and track all organizational assets</p>
            </div>
            <Button onClick={handleNewAsset} data-testid="button-new-asset">
              <i className="fas fa-plus mr-2"></i>
              New Asset
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
                      placeholder="Search assets by name, ID, or serial number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-assets"
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

              {/* Assets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Asset ID</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Serial Number</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Value</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-muted-foreground">Loading assets...</p>
                        </td>
                      </tr>
                    ) : assetsData?.assets?.length > 0 ? (
                      assetsData.assets.map((asset: any) => (
                        <tr key={asset.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-asset-${asset.id}`}>
                          <td className="px-4 py-3 font-mono text-primary">{asset.id}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">{asset.name}</p>
                              {asset.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">{asset.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">{asset.category}</td>
                          <td className="px-4 py-3 font-mono text-sm">{asset.serialNumber || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge 
                              variant={
                                asset.status === 'active' ? 'default' : 
                                asset.status === 'maintenance' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {asset.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {asset.currentValue ? `$${parseFloat(asset.currentValue).toLocaleString()}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEdit(asset)}
                                data-testid={`button-edit-asset-${asset.id}`}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(asset.id)}
                                disabled={deleteAssetMutation.isPending}
                                data-testid={`button-delete-asset-${asset.id}`}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <div className="text-muted-foreground">
                            <i className="fas fa-box text-4xl mb-4 block"></i>
                            <p className="text-lg font-medium">No assets found</p>
                            <p className="text-sm">
                              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first asset'}
                            </p>
                            {!searchTerm && (
                              <Button onClick={handleNewAsset} className="mt-4" data-testid="button-create-first-asset">
                                <i className="fas fa-plus mr-2"></i>
                                Create Asset
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {assetsData?.total > limit && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, assetsData.total)} of {assetsData.total} assets
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
                      Page {page + 1} of {Math.ceil(assetsData.total / limit)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= assetsData.total}
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
        </main>
      </div>

      {/* Asset Form Modal */}
      <Dialog open={showAssetForm} onOpenChange={setShowAssetForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAsset ? 'Edit Asset' : 'Create New Asset'}
            </DialogTitle>
          </DialogHeader>
          <AssetForm 
            asset={selectedAsset}
            onSuccess={() => {
              setShowAssetForm(false);
              setSelectedAsset(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
