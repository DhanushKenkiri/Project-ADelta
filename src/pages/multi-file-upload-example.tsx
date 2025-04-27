import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiFileUploader } from '@/components/MultiFileUploader';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';

const MultiFileUploadExample = () => {
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

  const handleFilesUploaded = (fileUrls: string[]) => {
    setUploadedFileUrls(prev => [...prev, ...fileUrls]);
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Helmet>
        <title>Multiple File Upload Example</title>
        <meta name="description" content="Example page demonstrating multiple file uploads to Azure Blob Storage" />
      </Helmet>
      
      <PageTitle title="Multiple File Upload Example" />
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-gray-900">
        <div className="container mx-auto py-8">
          <div className="glass-card">
            <h1 className="text-3xl font-bold mb-4 gradient-text">Multiple File Upload Example</h1>
            <p className="text-gray-300 mb-6">
              This example demonstrates how to upload multiple files to Azure Blob Storage and manage them within the UI.
            </p>
          
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <MultiFileUploader 
                  onFilesUploaded={handleFilesUploaded} 
                  acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.docx"
                  maxFileSizeMB={5}
                  maxFiles={10}
                />
              </div>
              
              <div>
                <Card className="h-full bg-gray-800 border-gray-700">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">Uploaded Files</h2>
                    
                    {uploadedFileUrls.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-gray-300">
                          <span className="font-medium">Total files uploaded:</span> {uploadedFileUrls.length}
                        </p>
                        
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                          {uploadedFileUrls.map((url, index) => (
                            <div key={index} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800 p-3">
                              {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <div className="aspect-square relative mb-2">
                                  <img 
                                    src={url} 
                                    alt={`Uploaded file ${index + 1}`} 
                                    className="object-cover w-full h-full rounded-md"
                                  />
                                </div>
                              ) : (
                                <div className="bg-gray-700 aspect-square flex items-center justify-center rounded-md mb-2">
                                  <p className="text-gray-300 text-sm font-medium">Non-image file</p>
                                </div>
                              )}
                              
                              <div className="text-center">
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Button size="sm" variant="secondary" className="w-full">
                                    View File
                                  </Button>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">
                        No files have been uploaded yet. Use the uploader on the left to upload multiple files.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MultiFileUploadExample; 