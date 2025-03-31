import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { PastPaper } from "@shared/schema";
import { Calendar, User, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

type PastPaperCardProps = {
  pastPaper: PastPaper;
  onView: () => void;
  unitCode: string;
};

export default function PastPaperCard({ pastPaper, onView, unitCode }: PastPaperCardProps) {
  const { toast } = useToast();

  // Handle download and view
  const handleDownload = () => {
    if (pastPaper.fileUrl) {
      window.open(pastPaper.fileUrl, "_blank");
      if (!pastPaper.viewed) {
        onView();
      }
    } else {
      toast({
        title: "No file attached",
        description: "This past paper doesn't have an attached file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{pastPaper.title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pastPaper.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {!pastPaper.viewed && (
              <Badge className="bg-blue-100 text-blue-600 text-xs py-1 px-2 rounded-md">New</Badge>
            )}
            <Badge className="bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded-md">{pastPaper.year}</Badge>
          </div>
        </div>
        
        <div className="flex items-center mt-4 space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(pastPaper.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center">
            <User className="mr-1 h-3 w-3" />
            <span>{pastPaper.uploadedBy}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-100">
        <div className="flex items-center">
          <img 
            src={pastPaper.uploaderImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(pastPaper.uploadedBy)}`} 
            alt={pastPaper.uploadedBy} 
            className="w-6 h-6 rounded-full mr-2"
          />
          <span className="text-xs text-gray-500">Uploaded by: {pastPaper.uploadedBy}</span>
        </div>
        
        {pastPaper.fileUrl && (
          <Button
            onClick={handleDownload}
            className={`text-sm font-medium ${
              unitCode.startsWith("MAT") ? "text-blue-500 hover:text-blue-700" : 
              unitCode.startsWith("STA") ? "text-green-500 hover:text-green-700" : 
              unitCode.startsWith("DAT") ? "text-purple-500 hover:text-purple-700" : 
              "text-amber-500 hover:text-amber-700"
            }`}
            variant="link"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
