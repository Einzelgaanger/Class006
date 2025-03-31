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

type PastPaperFormProps = {
  unitCode: string;
  isOpen: boolean;
  onClose: () => void;
};

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  year: z.string().min(4, "Year is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PastPaperForm({ unitCode, isOpen, onClose }: PastPaperFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      year: new Date().getFullYear().toString(),
    },
  });

  const createPastPaper = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("year", data.year);
      formData.append("unitCode", unitCode);
      
      if (file) {
        formData.append("file", file);
      }

      // Set a longer timeout for large file uploads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      try {
        const response = await fetch(`/api/units/${unitCode}/pastpapers`, {
          method: "POST",
          body: formData,
          credentials: "include",
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to upload past paper");
        }

        return response.json();
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error("Upload timed out. Please try with a smaller file or check your connection.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/pastpapers`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      form.reset();
      setFile(null);
      onClose();
      toast({
        title: "Past paper uploaded",
        description: "Past paper has been uploaded successfully",
      });
    },
    onError: (error: Error | unknown) => {
      let errorMessage = "An unexpected error occurred while uploading the past paper";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error uploading past paper",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createPastPaper.mutate(data);
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
          <DialogTitle>Upload Past Paper</DialogTitle>
          <DialogDescription>
            Share past exam papers for {unitCode}
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
                    <Input placeholder="Exam title" {...field} />
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
                      placeholder="Details about this exam paper..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="2000"
                      max="2050"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Attachment (Required)</FormLabel>
              <Input 
                type="file" 
                onChange={handleFileChange}
                className="mt-1" 
                required
              />
              <FormDescription>
                Upload the exam paper file (PDF preferred)
              </FormDescription>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createPastPaper.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createPastPaper.isPending || !file}
              >
                {createPastPaper.isPending ? "Uploading..." : "Upload Past Paper"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
