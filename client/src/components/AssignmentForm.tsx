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

type AssignmentFormProps = {
  unitCode: string;
  isOpen: boolean;
  onClose: () => void;
};

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  deadline: z.string()
    .refine(val => {
      try {
        // Validate date format
        return !!val && !isNaN(new Date(val).getTime());
      } catch (e) {
        return false;
      }
    }, "Please enter a valid date and time")
    .refine(val => {
      const now = new Date();
      const selectedDate = new Date(val);
      
      // Deadline must be at least 10 hours in the future
      const minDeadline = new Date(now.getTime() + 10 * 60 * 60 * 1000);
      return selectedDate >= minDeadline;
    }, "Deadline must be at least 10 hours in the future"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AssignmentForm({ unitCode, isOpen, onClose }: AssignmentFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Set default deadline to 1 week from now
  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // One week from now
    return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM for datetime-local input
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: getDefaultDeadline(),
    },
  });

  const createAssignment = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("deadline", data.deadline);
      formData.append("unitCode", unitCode);
      
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`/api/units/${unitCode}/assignments`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create assignment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/assignments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/deadlines"] });
      form.reset();
      setFile(null);
      onClose();
      toast({
        title: "Assignment created",
        description: "Assignment has been created successfully",
      });
    },
    onError: (error: Error | unknown) => {
      let errorMessage = "An unexpected error occurred while creating the assignment";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error creating assignment",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createAssignment.mutate(data);
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
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Add a new assignment for {unitCode}
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
                    <Input placeholder="Assignment title" {...field} />
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
                      placeholder="Describe the assignment..." 
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
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Deadline must be at least 10 hours in the future.
                  </FormDescription>
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
                Upload any related documents (PDF, DOCX, etc.)
              </FormDescription>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createAssignment.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createAssignment.isPending}
              >
                {createAssignment.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
