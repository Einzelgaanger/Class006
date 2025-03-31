import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, isPast, formatDistance } from "date-fns";
import { Assignment } from "@shared/schema";
import { Clock, Calendar, User, Download, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

type AssignmentCardProps = {
  assignment: Assignment;
  unitCode: string;
};

export default function AssignmentCard({ assignment, unitCode }: AssignmentCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Format deadline
  const deadlineDate = new Date(assignment.deadline);
  const isOverdue = isPast(deadlineDate) && !assignment.completed;

  // Calculate time elapsed since assignment was created
  const elapsedSinceCreation = assignment.completedAt 
    ? formatDistance(new Date(assignment.completedAt), new Date(assignment.createdAt))
    : null;

  // Update countdown timer
  useEffect(() => {
    if (assignment.completed) return;
    
    const updateTimer = () => {
      const now = new Date();
      const deadline = new Date(assignment.deadline);
      
      if (now > deadline) {
        setTimeLeft("Overdue");
        return;
      }
      
      setTimeLeft(formatDistanceToNow(deadline, { addSuffix: true }));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [assignment.deadline, assignment.completed]);

  // Mark as complete mutation
  const markComplete = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/units/${unitCode}/assignments/${assignment.id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to mark as complete");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/assignments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/rankings`] });
      toast({
        title: "Success",
        description: "Assignment marked as complete",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/units/${unitCode}/assignments/${assignment.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/assignments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      setShowDeleteDialog(false);
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle download
  const handleDownload = () => {
    if (assignment.fileUrl) {
      window.open(assignment.fileUrl, "_blank");
    } else {
      toast({
        title: "No file attached",
        description: "This assignment doesn't have an attached file.",
        variant: "destructive",
      });
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (assignment.completed) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  // Check if the current user is the creator of the assignment
  const isCreator = user?.name === assignment.uploadedBy;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow overflow-hidden relative">
        {/* Floating action button for mobile - visible only on small screens */}
        {!assignment.completed && (
          <Button 
            size="icon"
            disabled={markComplete.isPending}
            onClick={() => markComplete.mutate()}
            className={`${
              unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
              unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
              unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
              "bg-amber-500 hover:bg-amber-600"
            } text-white absolute top-2 right-2 sm:hidden z-10 rounded-full`}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
        
        <CardContent className="p-4 pt-4">
          <div className="flex items-start justify-between">
            <div className="pr-8 sm:pr-0">
              <h3 className="font-medium">{assignment.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assignment.description}</p>
            </div>
            <div className="hidden sm:block">
              {getStatusBadge()}
            </div>
          </div>
          
          <div className="flex items-center mt-4 space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              <span>
                Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              <span>{assignment.uploadedBy}</span>
            </div>
          </div>
          
          <div className="flex items-center mt-3">
            <div className="flex-1">
              {!assignment.completed && !isOverdue && (
                <div className="flex items-center text-xs">
                  <Clock className="mr-1 h-3 w-3 text-amber-500" />
                  <span className="text-amber-500 font-medium">{timeLeft}</span>
                </div>
              )}
              
              {assignment.completed && (
                <div className="flex items-center text-xs">
                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-600 font-medium">
                    Completed {formatDistanceToNow(new Date(assignment.completedAt!), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
            <div className="sm:hidden">
              {getStatusBadge()}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-100">
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
              View Details
            </Button>
            
            {isCreator && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span>Delete</span>
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {assignment.fileUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                <span>File</span>
              </Button>
            )}
            
            {!assignment.completed && (
              <Button 
                size="sm"
                disabled={markComplete.isPending}
                onClick={() => markComplete.mutate()}
                className={`${
                  unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                  unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                  unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                  "bg-amber-500 hover:bg-amber-600"
                } text-white hidden sm:flex`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Mark Done</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignment.title}</DialogTitle>
            <DialogDescription>
              {getStatusBadge()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Description:</h4>
              <p className="text-sm">{assignment.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <h4 className="font-semibold">Due Date:</h4>
                <p>{new Date(assignment.deadline).toLocaleString()}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Uploaded By:</h4>
                <p>{assignment.uploadedBy}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Uploaded On:</h4>
                <p>{new Date(assignment.createdAt).toLocaleString()}</p>
              </div>
              
              {assignment.completed && (
                <div>
                  <h4 className="font-semibold">Completed:</h4>
                  <p>{new Date(assignment.completedAt!).toLocaleString()}</p>
                </div>
              )}
              
              {elapsedSinceCreation && assignment.completed && (
                <div>
                  <h4 className="font-semibold">Completion Time:</h4>
                  <p>{elapsedSinceCreation} after posting</p>
                </div>
              )}
              
              {assignment.completed && (
                <div className="col-span-2 mt-2">
                  <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Assignment completed successfully</p>
                      <p className="text-sm text-green-600">
                        You completed this assignment {formatDistanceToNow(new Date(assignment.completedAt!), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              {isCreator && (
                <Button 
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => {
                    setShowDetails(false);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span>Delete Assignment</span>
                </Button>
              )}
              
              <div className="flex space-x-2 ml-auto">
                {assignment.fileUrl && (
                  <Button 
                    variant="outline" 
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span>Download File</span>
                  </Button>
                )}
                
                {!assignment.completed && (
                  <Button 
                    disabled={markComplete.isPending}
                    onClick={() => {
                      markComplete.mutate();
                      setShowDetails(false);
                    }}
                    className={`${
                      unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                      unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                      unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                      "bg-amber-500 hover:bg-amber-600"
                    } text-white`}
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Mark as Completed</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="font-medium">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
          </div>
          
          <DialogFooter className="flex space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteAssignment.isPending}
              onClick={() => deleteAssignment.mutate()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
