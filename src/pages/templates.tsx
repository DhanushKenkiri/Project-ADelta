import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, ChevronDown, Search, FilterIcon, RefreshCw } from 'lucide-react';
import { templateCategories, getTemplatesByCategory, searchTemplates, Template, getAllTemplates, clearTemplateCache } from '@/lib/templateUtils';
import { useNavigate, Link } from 'react-router-dom';
import TemplateCard from '@/components/TemplateCard';
import { toast } from 'sonner';
import PageTitle from '@/components/PageTitle';

// Template gallery page
const TemplatesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Clear template cache and load templates when component mounts
  useEffect(() => {
    clearTemplateCache();
    loadTemplates();
  }, []);

  // Filter templates based on category and search query
  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, searchQuery]);

  // Function to load templates
  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Get templates based on category
      let filteredTemplates: Template[];
      if (selectedCategory !== 'all') {
        filteredTemplates = await getTemplatesByCategory(selectedCategory);
      } else {
        filteredTemplates = await getAllTemplates();
      }
      
      // Filter by search query
      if (searchQuery) {
        const searchResults = await searchTemplates(searchQuery);
        
        // If we also have a category filter, intersect the results
        if (selectedCategory !== 'all') {
          filteredTemplates = searchResults.filter(t => 
            filteredTemplates.some(ct => ct.id === t.id)
          );
        } else {
          filteredTemplates = searchResults;
        }
      }
      
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    clearTemplateCache();
    loadTemplates();
    toast.success('Templates refreshed');
  };

  // Navigate to home page
  const navigateToHome = () => {
    navigate('/');
  };

  // Render start from scratch card
  const renderStartFromScratchCard = () => {
    return (
      <div 
        className="bg-neutral-800 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-neutral-700"
        onClick={navigateToHome}
      >
        <div className="h-48 overflow-hidden bg-neutral-900 flex items-center justify-center p-4 border-b border-neutral-700">
          <div className="text-center">
            <div className="text-indigo-400 font-medium mb-2">Start from scratch</div>
            <div className="text-sm text-gray-400">
              Create professionally-designed transactional emails.
            </div>
          </div>
        </div>
        <div className="p-4 flex justify-center">
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors">
            Choose
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Templates" />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="mb-4 flex justify-between items-center">
            <Link to="/" className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200">
              <ArrowLeft size={16} className="mr-1" />
              Back to home
            </Link>
            <button 
              onClick={handleRefresh} 
              className="flex items-center text-sm text-gray-400 hover:text-gray-200 bg-neutral-800 px-3 py-1 rounded"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Templates
            </button>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-100 mb-8">Choose from gallery</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filter sidebar */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-neutral-800 p-4 rounded-md shadow-sm border border-neutral-700">
                <h2 className="font-medium mb-4 text-gray-200">Filter</h2>
                
                <div className="space-y-2">
                  {templateCategories.map(category => (
                    <div 
                      key={category.id}
                      className={`flex items-center cursor-pointer p-2 rounded-md ${
                        selectedCategory === category.id 
                          ? 'bg-neutral-700 text-indigo-400' 
                          : 'text-gray-400 hover:bg-neutral-700'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.id === 'all' ? (
                        <input 
                          type="checkbox" 
                          checked={selectedCategory === category.id}
                          onChange={() => {}}
                          className="mr-2"
                        />
                      ) : (
                        <FilterIcon size={16} className="mr-2" />
                      )}
                      <span className="text-sm">{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Templates grid */}
            <div className="flex-1">
              {/* Search bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 placeholder-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-neutral-800 rounded-md h-64"></div>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No templates found. Try a different search term or category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedCategory === 'all' && renderStartFromScratchCard()}
                  {templates.map(template => (
                    <TemplateCard 
                      key={template.id} 
                      template={template}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TemplatesPage; 