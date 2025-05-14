import { useState, useCallback } from 'react';
import { saveTemplateToStorage, updateTemplateInStorage, deleteTemplateFromStorage, getTemplateById } from '@/lib/templateUtils';
import { Template } from '@/lib/templateUtils';
import { toast } from 'sonner';

interface UseTemplateStorageProps {
  onSuccess?: (template?: Template) => void;
  onError?: (error: any) => void;
}

export const useTemplateStorage = (props?: UseTemplateStorageProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [template, setTemplate] = useState<Template | null>(null);

  const saveTemplate = useCallback(async (
    name: string,
    htmlContent: string,
    description?: string,
    category?: string,
    thumbnailImage?: File
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await saveTemplateToStorage(
        name,
        htmlContent,
        description,
        category,
        thumbnailImage
      );
      
      if (result.success && result.template) {
        setTemplate(result.template);
        toast.success('Template saved successfully');
        props?.onSuccess?.(result.template);
        return result.template;
      } else {
        const errorMessage = result.error?.message || 'Failed to save template';
        setError(errorMessage);
        toast.error(errorMessage);
        props?.onError?.(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error saving template: ${errorMessage}`);
      props?.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [props]);

  const updateTemplate = useCallback(async (
    templateId: string,
    updates: {
      name?: string;
      htmlContent?: string;
      description?: string;
      category?: string;
      thumbnailImage?: File;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await updateTemplateInStorage(templateId, updates);
      
      if (result.success && result.template) {
        setTemplate(result.template);
        toast.success('Template updated successfully');
        props?.onSuccess?.(result.template);
        return result.template;
      } else {
        const errorMessage = result.error?.message || 'Failed to update template';
        setError(errorMessage);
        toast.error(errorMessage);
        props?.onError?.(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error updating template: ${errorMessage}`);
      props?.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [props]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteTemplateFromStorage(templateId);
      
      if (result.success) {
        setTemplate(null);
        toast.success('Template deleted successfully');
        props?.onSuccess?.();
        return true;
      } else {
        const errorMessage = result.error?.message || 'Failed to delete template';
        setError(errorMessage);
        toast.error(errorMessage);
        props?.onError?.(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error deleting template: ${errorMessage}`);
      props?.onError?.(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [props]);

  const fetchTemplate = useCallback(async (templateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const template = await getTemplateById(templateId);
      
      if (template) {
        setTemplate(template);
        props?.onSuccess?.(template);
        return template;
      } else {
        setError('Template not found');
        props?.onError?.('Template not found');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error fetching template: ${errorMessage}`);
      props?.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [props]);

  return {
    loading,
    error,
    template,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplate
  };
};