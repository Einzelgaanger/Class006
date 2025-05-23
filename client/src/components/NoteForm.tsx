import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type NoteFormProps = {
  unitCode: string;
  isOpen: boolean;
  onClose: () => void;
};

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NoteForm({ unitCode, isOpen, onClose }: NoteFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createNote = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("unitCode", unitCode);
      
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`/api/units/${unitCode}/notes`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create note");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/notes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      form.reset();
      setFile(null);
      onClose();
      toast({
        title: "Note uploaded",
        description: "Note has been uploaded successfully",
      });
    },
    onError: (error: Error | unknown) => {
      let errorMessage = "An unexpected error occurred while uploading the note";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error uploading note",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createNote.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Notes</DialogTitle>
          <DialogDescription>
            Share notes or study materials for {unitCode}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Note title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe these notes..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Attachment (Optional)</FormLabel>
              <Input 
                type="file" 
                onChange={handleFileChange}
                className="mt-1" 
              />
              <FormDescription>
                Upload your notes file (PDF, DOCX, etc.)
              </FormDescription>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createNote.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createNote.isPending}
              >
                {createNote.isPending ? "Uploading..." : "Upload Notes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
