import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfileImageUpload() {
  const { user, updateProfileImageMutation } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (1MB max)
      if (file.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 1MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current?.files?.[0]) {
      const formData = new FormData();
      formData.append('profileImage', fileInputRef.current.files[0]);
      
      updateProfileImageMutation.mutate(formData);
    } else {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="relative">
        <img 
          src={previewUrl || user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}`} 
          alt="Profile" 
          className="w-32 h-32 rounded-full object-cover border-4 border-primary"
        />
        <Button 
          className="absolute bottom-0 right-0 bg-primary rounded-full p-2 text-white cursor-pointer"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
        </Button>
        {user?.rank && (
          <span className="absolute -top-1 -right-1 bg-white rounded-full text-sm font-semibold px-1.5 py-0.5 text-primary border border-primary">
            #{user.rank}
          </span>
        )}
      </div>
      
      <div className="text-center">
        <h3 className="font-medium text-lg">{user?.name}</h3>
        <p className="text-gray-500 text-sm">{user?.admissionNumber}</p>
      </div>
      
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Photo</label>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*" 
          className="w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-medium
            file:bg-primary file:text-white
            hover:file:bg-blue-600"
        />
        <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF. 1MB max.</p>
        
        {previewUrl && (
          <Button 
            className="w-full mt-2"
            onClick={handleUpload}
            disabled={updateProfileImageMutation.isPending}
          >
            {updateProfileImageMutation.isPending ? "Uploading..." : "Save Profile Picture"}
          </Button>
        )}
      </div>
    </>
  );
}
