import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const documentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(['contract', 'invoice', 'manual', 'certificate', 'report', 'other']),
  linkedEntityType: z.string().optional(),
  linkedEntityId: z.string().optional(),
  retentionPolicy: z.string().optional(),
  retentionExpiry: z.string().optional(),
  tags: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface DocumentFormProps {
  document?: any;
  onSuccess: () => void;
}

export default function DocumentForm({ document, onSuccess }: DocumentFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: document?.title || '',
      description: document?.description || '',
      type: document?.type || 'other',
      linkedEntityType: document?.linkedEntityType || '',
      linkedEntityId: document?.linkedEntityId || '',
      retentionPolicy: document?.retentionPolicy || '',
      retentionExpiry: document?.retentionExpiry ? new Date(document.retentionExpiry).toISOString().split('T')[0] : '',
      tags: document?.tags?.join(', ') || '',
    },
  });

  const saveDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        retentionExpiry: data.retentionExpiry ? new Date(data.retentionExpiry).toISOString() : undefined,
        // For now, we'll simulate file upload with mock data since actual file upload
        // would require additional backend setup for file handling
        filename: selectedFile?.name || document?.filename || 'document.pdf',
        fileSize: selectedFile?.size || document?.fileSize || 0,
        mimeType: selectedFile?.type || document?.mimeType || 'application/pdf',
        filePath: `/uploads/${selectedFile?.name || document?.filename || 'document.pdf'}`,
      };

      if (document) {
        await apiRequest("PUT", `/api/documents/${document.id}`, payload);
      } else {
        await apiRequest("POST", "/api/documents", payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Document ${document ? 'updated' : 'uploaded'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onSuccess();
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
        description: `Failed to ${document ? 'update' : 'upload'} document`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DocumentFormValues) => {
    if (!document && !selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    saveDocumentMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate title if empty
      if (!form.getValues('title')) {
        form.setValue('title', file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-document">
        {/* File Upload */}
        {!document && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">File *</label>
            <Input
              type="file"
              onChange={handleFileChange}
              className="cursor-pointer"
              data-testid="input-document-file"
            />
            {selectedFile && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Document title" {...field} data-testid="input-document-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Document description or summary" 
                  {...field} 
                  data-testid="textarea-document-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="linkedEntityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Entity Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-linked-entity-type">
                      <SelectValue placeholder="Optional - link to entity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No Link</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedEntityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entity ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter entity ID (e.g., AST-1001)" 
                    {...field} 
                    data-testid="input-linked-entity-id"
                    disabled={!form.watch('linkedEntityType')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="retentionPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retention Policy</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 7 years, permanent" 
                    {...field} 
                    data-testid="input-retention-policy"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="retentionExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retention Expiry</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-retention-expiry" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Tags separated by commas (e.g., important, legal, confidential)" 
                  {...field} 
                  data-testid="input-document-tags"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
            data-testid="button-cancel-document"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saveDocumentMutation.isPending}
            data-testid="button-save-document"
          >
            {saveDocumentMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {document ? 'Updating...' : 'Uploading...'}
              </div>
            ) : (
              <>{document ? 'Update' : 'Upload'} Document</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
