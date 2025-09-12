import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import DocumentForm from "@/components/document-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Documents() {
  const { toast } = useToast();
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["/api/documents", { limit, offset: page * limit, search: searchTerm }],
    retry: false,
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
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
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const handleNewDocument = () => {
    setSelectedDocument(null);
    setShowDocumentForm(true);
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return 'fa-file-pdf text-red-600';
    if (mimeType?.includes('image')) return 'fa-file-image text-blue-600';
    if (mimeType?.includes('video')) return 'fa-file-video text-purple-600';
    if (mimeType?.includes('audio')) return 'fa-file-audio text-green-600';
    if (mimeType?.includes('word')) return 'fa-file-word text-blue-800';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'fa-file-excel text-green-800';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'fa-file-powerpoint text-orange-600';
    return 'fa-file text-muted-foreground';
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Documents</h2>
              <p className="text-sm text-muted-foreground">Manage organizational documents and files</p>
            </div>
            <Button onClick={handleNewDocument} data-testid="button-new-document">
              <i className="fas fa-upload mr-2"></i>
              Upload Document
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
                      placeholder="Search documents by title, filename, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-documents"
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

              {/* Documents Grid */}
              <div className="p-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading documents...</p>
                  </div>
                ) : documentsData?.documents?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {documentsData.documents.map((document: any) => (
                      <Card key={document.id} className="hover:shadow-md transition-shadow" data-testid={`card-document-${document.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <i className={`fas ${getFileIcon(document.mimeType)} text-2xl`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate" title={document.title}>
                                {document.title}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono truncate" title={document.filename}>
                                {document.filename}
                              </p>
                              {document.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {document.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className="text-xs">
                                {document.type}
                              </Badge>
                              <span className="text-muted-foreground">
                                {document.fileSize ? formatFileSize(document.fileSize) : 'Unknown'}
                              </span>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <div className="flex items-center justify-between">
                                <span>
                                  {new Date(document.uploadedAt).toLocaleDateString()}
                                </span>
                                <span className="font-mono text-primary">
                                  {document.id}
                                </span>
                              </div>
                            </div>

                            {document.linkedEntityType && document.linkedEntityId && (
                              <div className="text-xs">
                                <Badge variant="secondary" className="text-xs">
                                  Linked to {document.linkedEntityType}: {document.linkedEntityId}
                                </Badge>
                              </div>
                            )}

                            {document.tags && document.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {document.tags.slice(0, 2).map((tag: string, index: number) => (
                                  <span 
                                    key={index}
                                    className="text-xs bg-accent text-accent-foreground px-1 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {document.tags.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{document.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleEdit(document)}
                                  data-testid={`button-edit-document-${document.id}`}
                                >
                                  <i className="fas fa-edit text-xs"></i>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDelete(document.id)}
                                  disabled={deleteDocumentMutation.isPending}
                                  data-testid={`button-delete-document-${document.id}`}
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                </Button>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownload(document.id, document.filename)}
                                data-testid={`button-download-document-${document.id}`}
                              >
                                <i className="fas fa-download text-xs"></i>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <i className="fas fa-file-alt text-6xl mb-4 block"></i>
                      <p className="text-lg font-medium">No documents found</p>
                      <p className="text-sm">
                        {searchTerm ? 'Try adjusting your search terms' : 'Get started by uploading your first document'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleNewDocument} className="mt-4" data-testid="button-create-first-document">
                          <i className="fas fa-upload mr-2"></i>
                          Upload Document
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {documentsData?.total > limit && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {page * limit + 1} to {Math.min((page + 1) * limit, documentsData.total)} of {documentsData.total} documents
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
                        Page {page + 1} of {Math.ceil(documentsData.total / limit)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={(page + 1) * limit >= documentsData.total}
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

      {/* Document Form Modal */}
      <Dialog open={showDocumentForm} onOpenChange={setShowDocumentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? 'Edit Document' : 'Upload New Document'}
            </DialogTitle>
          </DialogHeader>
          <DocumentForm 
            document={selectedDocument}
            onSuccess={() => {
              setShowDocumentForm(false);
              setSelectedDocument(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
