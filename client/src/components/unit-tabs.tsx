import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Assignment, Note, PastPaper } from "@shared/schema";
import AssignmentForm from "./AssignmentForm";
import NoteForm from "./NoteForm";
import PastPaperForm from "./PastPaperForm";
import AssignmentCard from "./AssignmentCard";
import NoteCard from "./NoteCard";
import PastPaperCard from "./PastPaperCard";
import RankingTable from "./RankingTable";
import { AlertCircle, Check, FileText, BarChart } from "lucide-react";
import { Button } from "./ui/button";

type UnitTabsProps = {
  unitCode: string;
};

export default function UnitTabs({ unitCode }: UnitTabsProps) {
  // State for modal visibility
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);
  const [isPastPapersModalOpen, setIsPastPapersModalOpen] = useState(false);

  // Fetch content for the tabs
  const { data: notes, isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: [`/api/units/${unitCode}/notes`],
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: [`/api/units/${unitCode}/assignments`],
  });

  const { data: pastPapers, isLoading: isLoadingPastPapers } = useQuery<PastPaper[]>({
    queryKey: [`/api/units/${unitCode}/pastpapers`],
  });

  // Count notifications
  const unreadNotes = notes?.filter(note => !note.viewed).length || 0;
  const pendingAssignments = assignments?.filter(assignment => !assignment.completed).length || 0;
  const unreadPastPapers = pastPapers?.filter(paper => !paper.viewed).length || 0;

  // Create mutations for marking as viewed/completed
  const markNoteViewed = useMutation({
    mutationFn: async (noteId: number) => {
      await fetch(`/api/units/${unitCode}/notes/${noteId}/view`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/notes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
    },
  });

  const markPaperViewed = useMutation({
    mutationFn: async (paperId: number) => {
      await fetch(`/api/units/${unitCode}/pastpapers/${paperId}/view`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/pastpapers`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
    },
  });

  return (
    <>
      <Tabs defaultValue="notes">
        <div className="overflow-x-auto pb-2 mb-2">
          <TabsList className="mb-2 inline-flex min-w-max">
            <TabsTrigger value="notes" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
              {unreadNotes > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                  {unreadNotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>Assignments</span>
              {pendingAssignments > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                  {pendingAssignments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pastpapers" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Past Papers</span>
              {unreadPastPapers > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                  {unreadPastPapers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rank" className="flex items-center space-x-2">
              <BarChart className="h-4 w-4" />
              <span>Rank</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notes">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Course Notes</h2>
              <p className="text-sm text-gray-600">Lecture notes, supplementary materials and study guides</p>
            </div>
            
            <Button
              onClick={() => setIsNotesModalOpen(true)}
              className={`${
                unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                "bg-amber-500 hover:bg-amber-600"
              } text-white`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Notes
            </Button>
          </div>
          
          {isLoadingNotes ? (
            <div className="text-center py-10">Loading notes...</div>
          ) : notes?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No notes available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes?.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onView={() => markNoteViewed.mutate(note.id)}
                  unitCode={unitCode}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Assignments</h2>
              <p className="text-sm text-gray-600">Homework, projects and other assessments</p>
            </div>
            
            <Button
              onClick={() => setIsAssignmentsModalOpen(true)}
              className={`${
                unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                "bg-amber-500 hover:bg-amber-600"
              } text-white`}
            >
              <Check className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </div>
          
          {isLoadingAssignments ? (
            <div className="text-center py-10">Loading assignments...</div>
          ) : assignments?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No assignments available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments?.map(assignment => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  unitCode={unitCode}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pastpapers">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Past Papers</h2>
              <p className="text-sm text-gray-600">Previous exams, quizzes and assessment papers</p>
            </div>
            
            <Button
              onClick={() => setIsPastPapersModalOpen(true)}
              className={`${
                unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                "bg-amber-500 hover:bg-amber-600"
              } text-white`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Past Paper
            </Button>
          </div>
          
          {isLoadingPastPapers ? (
            <div className="text-center py-10">Loading past papers...</div>
          ) : pastPapers?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No past papers available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastPapers?.map(paper => (
                <PastPaperCard
                  key={paper.id}
                  pastPaper={paper}
                  onView={() => markPaperViewed.mutate(paper.id)}
                  unitCode={unitCode}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rank">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Assignment Rankings</h2>
            <p className="text-sm text-gray-600">Student performance based on assignment completion times</p>
          </div>
          
          <RankingTable unitCode={unitCode} />
        </TabsContent>
      </Tabs>

      {/* Modals for forms */}
      <NoteForm 
        unitCode={unitCode}
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)} 
      />
      
      <AssignmentForm 
        unitCode={unitCode}
        isOpen={isAssignmentsModalOpen}
        onClose={() => setIsAssignmentsModalOpen(false)}
      />
      
      <PastPaperForm 
        unitCode={unitCode}
        isOpen={isPastPapersModalOpen}
        onClose={() => setIsPastPapersModalOpen(false)}
      />
    </>
  );
}
