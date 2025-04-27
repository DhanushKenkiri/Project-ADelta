import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface FileUploaderProps {
  onFileUploaded?: (fileUrl: string) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
}

export function FileUploader({
  onFileUploaded,
  acceptedFileTypes = '*',
  maxFileSizeMB = 10
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadSuccess(false);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSizeMB}MB limit`);
      return;
    }

    setFile(selectedFile);
  };

  const uploadFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadSuccess(false);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

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
      setUploadProgress(100);
      setUploadSuccess(true);
      
      toast({
        title: 'Upload Successful',
        description: 'File has been uploaded successfully',
      });

      if (onFileUploaded && data.url) {
        onFileUploaded(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploader = () => {
    setFile(null);
    setUploadProgress(0);
    setError(null);
    setUploadSuccess(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
        <CardDescription>Upload files to Azure Blob Storage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="file-input" className="cursor-pointer text-sm font-medium">
                {file ? file.name : 'Click to select or drag and drop'}
              </label>
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={acceptedFileTypes}
                disabled={isUploading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max file size: {maxFileSizeMB}MB
            </p>
          </div>

          {(uploadProgress > 0 || isUploading) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {error && (
            <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {uploadSuccess && !error && (
            <div className="flex items-center p-4 text-green-800 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">File uploaded successfully!</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetUploader}
          disabled={isUploading || (!file && !uploadSuccess && !error)}
        >
          Reset
        </Button>
        <Button 
          onClick={uploadFile} 
          disabled={!file || isUploading || uploadSuccess}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </CardFooter>
    </Card>
  );
} 