import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface MultiFileUploaderProps {
  onFilesUploaded?: (fileUrls: string[]) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  maxFiles?: number;
}

type FileUploadStatus = {
  file: File;
  progress: number;
  error: string | null;
  url: string | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
};

export function MultiFileUploader({
  onFilesUploaded,
  acceptedFileTypes = '*',
  maxFileSizeMB = 10,
  maxFiles = 5
}: MultiFileUploaderProps) {
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Check if adding these files would exceed the max files limit
    if (fileStatuses.length + selectedFiles.length > maxFiles) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: `You can only upload a maximum of ${maxFiles} files at once`,
      });
      return;
    }

    // Filter and validate files
    const validFiles = selectedFiles.filter(file => {
      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds the ${maxFileSizeMB}MB limit`,
        });
        return false;
      }
      return true;
    });

    // Add valid files to the state
    setFileStatuses(prev => [
      ...prev,
      ...validFiles.map(file => ({
        file,
        progress: 0,
        error: null,
        url: null,
        status: 'pending' as const,
      })),
    ]);

    // Reset the input
    e.target.value = '';
  };

  const uploadFiles = async () => {
    if (!fileStatuses.length || isUploading) return;

    const pendingFiles = fileStatuses.filter(status => status.status === 'pending');
    if (!pendingFiles.length) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    // Clone the statuses to avoid state mutation issues
    const newFileStatuses = [...fileStatuses];

    try {
      // Upload each file in sequence
      for (let i = 0; i < pendingFiles.length; i++) {
        const fileIndex = fileStatuses.findIndex(fs => fs.file === pendingFiles[i].file);
        if (fileIndex === -1) continue;

        newFileStatuses[fileIndex].status = 'uploading';
        setFileStatuses([...newFileStatuses]);

        // Start simulated progress updates for current file
        const progressInterval = setInterval(() => {
          setFileStatuses(currentStatuses => {
            const updated = [...currentStatuses];
            if (updated[fileIndex].progress < 90) {
              updated[fileIndex].progress += 10;
            }
            return updated;
          });
        }, 300);

        try {
          // Create a FormData object for each file
          const formData = new FormData();
          formData.append('file', pendingFiles[i].file);

          // Make the API request to upload the file
          const response = await fetch('/api/storage/upload-file', {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload file');
          }

          const data = await response.json();
          
          // Update the file status
          newFileStatuses[fileIndex].progress = 100;
          newFileStatuses[fileIndex].status = 'success';
          newFileStatuses[fileIndex].url = data.url;
          setFileStatuses([...newFileStatuses]);
          
          uploadedUrls.push(data.url);
        } catch (err) {
          clearInterval(progressInterval);
          newFileStatuses[fileIndex].status = 'error';
          newFileStatuses[fileIndex].error = err instanceof Error ? err.message : 'An unknown error occurred';
          setFileStatuses([...newFileStatuses]);
          
          toast({
            variant: 'destructive',
            title: `Failed to upload ${pendingFiles[i].file.name}`,
            description: err instanceof Error ? err.message : 'An unknown error occurred',
          });
        }
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: 'Upload Successful',
          description: `${uploadedUrls.length} file(s) uploaded successfully`,
        });

        if (onFilesUploaded) {
          onFilesUploaded(uploadedUrls);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    if (isUploading) return;
    
    setFileStatuses(current => {
      const updated = [...current];
      updated.splice(index, 1);
      return updated;
    });
  };

  const resetUploader = () => {
    if (isUploading) return;
    setFileStatuses([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Multiple Files</CardTitle>
        <CardDescription>
          Upload up to {maxFiles} files to Azure Blob Storage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => document.getElementById('multi-file-input')?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2">
            <label htmlFor="multi-file-input" className="cursor-pointer text-sm font-medium">
              Click to select or drag and drop
            </label>
            <input
              id="multi-file-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              disabled={isUploading || fileStatuses.length >= maxFiles}
              multiple
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max file size: {maxFileSizeMB}MB | {fileStatuses.length}/{maxFiles} files selected
          </p>
        </div>

        {fileStatuses.length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-medium">Selected Files</h3>
            {fileStatuses.map((fileStatus, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2 truncate">
                    {fileStatus.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : fileStatus.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm truncate max-w-[200px]">{fileStatus.file.name}</span>
                  </div>
                  <Button
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={isUploading}
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {(fileStatus.progress > 0 || fileStatus.status === 'uploading') && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{fileStatus.status === 'uploading' ? 'Uploading...' : fileStatus.status}</span>
                      <span>{fileStatus.progress}%</span>
                    </div>
                    <Progress value={fileStatus.progress} className="h-1" />
                  </div>
                )}
                
                {fileStatus.error && (
                  <p className="text-xs text-red-500 mt-1">{fileStatus.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetUploader}
          disabled={isUploading || fileStatuses.length === 0}
        >
          Reset
        </Button>
        <Button 
          onClick={uploadFiles} 
          disabled={isUploading || fileStatuses.filter(f => f.status === 'pending').length === 0}
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </CardFooter>
    </Card>
  );
} 