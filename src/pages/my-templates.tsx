import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, AlertCircle, WifiOff } from 'lucide-react';
import { getUserTemplates } from '@/services/templateStorageService';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadTemplates = async () => {
      try {
        setLoading(true);
        const result = await getUserTemplates();
        console.log('Templates result:', result); // Debugging

        if (result.success) {
          setTemplates(result.templates || []);
          setError(null);
          
          // If we get data from local storage fallback, show offline indicator
          if (result.offline) {
            setOfflineMode(true);
            toast({
              title: 'Offline Mode',
              description: 'Using local storage. Some features may be limited.',
              variant: 'default',
            });
          } else {
            setOfflineMode(false);
          }
        } else {
          setError('Failed to load your templates. Please try again later.');
          
          // Check if this is a connectivity issue
          if (result.error?.message?.includes('network') || 
              result.error?.message?.includes('connect') ||
              result.error?.message?.includes('offline')) {
            setOfflineMode(true);
          }
          
          toast({
            title: 'Error loading templates',
            description: result.error?.message || 'An unknown error occurred',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('An unexpected error occurred while loading templates.');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user, navigate, toast]);

  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/edit/${templateId}`);
  };

  const handleCreateTemplate = () => {
    navigate('/templates/create');
  };

  const getDateDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Your Templates" />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Your Templates</h1>
            <div className="flex items-center gap-3">
              {offlineMode && (
                <div className="flex items-center text-amber-500 text-sm">
                  <WifiOff size={16} className="mr-1" />
                  <span>Offline Mode</span>
                </div>
              )}
              <Button onClick={handleCreateTemplate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading your templates...</span>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              {offlineMode && (
                <div className="text-center py-6">
                  <h3 className="text-lg font-medium mb-2">Working Offline</h3>
                  <p className="text-muted-foreground mb-4">
                    It appears you are currently offline or cannot connect to the server.
                    You can still create and edit templates, but your changes will be stored locally.
                  </p>
                  <Button onClick={handleCreateTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template Offline
                  </Button>
                </div>
              )}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-4">You don't have any templates yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first template to see it here.
                {offlineMode && ' Templates created in offline mode will be stored locally.'}
              </p>
              <Button onClick={handleCreateTemplate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="recent">Recently Updated</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div 
                        className="h-40 bg-cover bg-center cursor-pointer" 
                        style={{ 
                          backgroundImage: `url(${template.thumbnailUrl || '/images/default-template-thumbnail.jpg'})` 
                        }}
                        onClick={() => handleEditTemplate(template.id)}
                      />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Updated {getDateDisplay(template.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm py-2">
                        <p className="line-clamp-2">{template.description || 'No description provided'}</p>
                      </CardContent>
                      <CardFooter className="pt-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditTemplate(template.id)}
                        >
                          Edit Template
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...templates]
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 6)
                    .map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <div 
                          className="h-40 bg-cover bg-center cursor-pointer" 
                          style={{ 
                            backgroundImage: `url(${template.thumbnailUrl || '/images/default-template-thumbnail.jpg'})` 
                          }}
                          onClick={() => handleEditTemplate(template.id)}
                        />
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            Updated {getDateDisplay(template.updatedAt)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm py-2">
                          <p className="line-clamp-2">{template.description || 'No description provided'}</p>
                        </CardContent>
                        <CardFooter className="pt-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditTemplate(template.id)}
                          >
                            Edit Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
} 