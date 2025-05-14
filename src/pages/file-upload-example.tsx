import { NextPage } from 'next';
import Head from 'next/head';
import { FileUploader } from '@/components/FileUploader';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const FileUploadExample: NextPage = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const handleFileUploaded = (fileUrl: string) => {
    setUploadedFileUrl(fileUrl);
  };

  return (
    <>
      <Head>
        <title>File Upload Example</title>
        <meta name="description" content="Example page demonstrating file uploads to Azure Blob Storage" />
      </Head>
      
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">File Upload Example</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <FileUploader 
              onFileUploaded={handleFileUploaded} 
              acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.docx"
              maxFileSizeMB={5}
            />
          </div>
          
          <div>
            <Card className="h-full">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Uploaded File</h2>
                
                {uploadedFileUrl ? (
                  <div className="space-y-4">
                    <p className="text-sm break-all">
                      <span className="font-medium">URL:</span> {uploadedFileUrl}
                    </p>
                    
                    {uploadedFileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img 
                          src={uploadedFileUrl} 
                          alt="Uploaded file preview" 
                          className="max-w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <Link 
                          href={uploadedFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button className="mt-2">
                            View File
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No file has been uploaded yet. Use the uploader on the left to upload a file.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default FileUploadExample; 