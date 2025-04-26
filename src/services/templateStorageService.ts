import { uploadFile, downloadFile, getPublicUrl, listFiles, deleteFile, StorageBucket, isStorageAccessible } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { generateThumbnail, dataUrlToFile } from './thumbnailService';
import { fluvioService } from '@/lib/fluvioService';

// In-memory fallback storage when Supabase is not available
const localStorageFallback = {
  templates: new Map<string, {
    id: string;
    name: string;
    description: string;
    category: string;
    htmlContent: string;
    thumbnailUrl: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
  }>()
};

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

type TemplatesTable = {
  id: string;
  name: string;
  description: string;
  category: string;
  html_url: string;
  thumbnail_url: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

// Helper function to check if we should use fallback storage
const shouldUseFallback = async (): Promise<boolean> => {
  try {
    const storageAvailable = await isStorageAccessible();
    if (!storageAvailable) {
      console.log('Using local fallback storage since Supabase is not accessible');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Error checking storage accessibility:', error);
    return true;
  }
};

export const saveTemplate = async (
  name: string,
  htmlContent: string,
  description: string = '',
  category: string = 'general',
  thumbnailImage?: File
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const templateId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      // Use local storage fallback
      let thumbnailUrl = '/images/default-template-thumbnail.jpg';
      
      // If thumbnail provided, we'd normally process it
      // For local storage, just store the default or a data URL if possible
      if (thumbnailImage) {
        try {
          thumbnailUrl = URL.createObjectURL(thumbnailImage);
        } catch (err) {
          console.warn('Could not create object URL for thumbnail in fallback mode');
        }
      } else {
        try {
          const thumbDataUrl = await generateThumbnail(htmlContent);
          if (thumbDataUrl) {
            thumbnailUrl = thumbDataUrl;
          }
        } catch (thumbErr) {
          console.error('Error generating thumbnail in fallback mode:', thumbErr);
        }
      }
      
      // Store in memory
      localStorageFallback.templates.set(templateId, {
        id: templateId,
        name,
        description,
        category,
        htmlContent,
        thumbnailUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId: user.id
      });
      
      return {
        success: true,
        template: {
          id: templateId,
          name,
          description,
          category,
          htmlUrl: `memory://${templateId}`,
          thumbnailUrl
        }
      };
    }
    
    // Normal Supabase flow
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
    const templateFile = new File(
      [new Blob([htmlContent], { type: 'text/html' })],
      `${sanitizedName}.html`, 
      { type: 'text/html' }
    );
    
    const templatePath = `${user.id}/${templateId}/${templateFile.name}`;
    
    const uploadResult = await uploadFile(
      StorageBucket.TEMPLATES,
      templatePath,
      templateFile
    );
    
    if (!uploadResult.success) {
      throw uploadResult.error || new Error('Failed to upload template file');
    }
    
    const templateUrl = getPublicUrl(StorageBucket.TEMPLATES, templatePath);
    
    let thumbnailUrl = '';
    
    if (thumbnailImage) {
      const fileExt = thumbnailImage.name.split('.').pop();
      const thumbnailPath = `${user.id}/${templateId}/thumbnail.${fileExt}`;
      
      const thumbResult = await uploadFile(
        StorageBucket.TEMPLATES,
        thumbnailPath,
        thumbnailImage
      );
      
      if (thumbResult.success) {
        thumbnailUrl = getPublicUrl(StorageBucket.TEMPLATES, thumbnailPath);
      }
    }
    
    if (!thumbnailUrl) {
      try {
        const thumbDataUrl = await generateThumbnail(htmlContent);
        
        if (thumbDataUrl) {
          const thumbFile = dataUrlToFile(thumbDataUrl, `thumbnail-${templateId}.jpg`);
          const thumbPath = `${user.id}/${templateId}/thumbnail.jpg`;
          
          const genThumbResult = await uploadFile(
            StorageBucket.TEMPLATES,
            thumbPath,
            thumbFile
          );
          
          if (genThumbResult.success) {
            thumbnailUrl = getPublicUrl(StorageBucket.TEMPLATES, thumbPath);
          }
        }
      } catch (thumbErr) {
        console.error('Error generating thumbnail:', thumbErr);
      }
      
      if (!thumbnailUrl) {
        thumbnailUrl = '/images/default-template-thumbnail.jpg';
      }
    }
    
    const { data, error } = await supabase
      .from('templates')
      .insert({
        id: templateId,
        name,
        description,
        category,
        html_url: templateUrl,
        thumbnail_url: thumbnailUrl,
        user_id: user.id,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select<string, TemplatesTable>()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      template: {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        htmlUrl: data.html_url,
        thumbnailUrl: data.thumbnail_url
      }
    };
  } catch (err) {
    console.error('Failed to save template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error saving template') 
    };
  }
};

export const getTemplateById = async (templateId: string) => {
  try {
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      const template = localStorageFallback.templates.get(templateId);
      
      if (!template) {
        throw new Error('Template not found in local storage');
      }
      
      return {
        success: true,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          htmlContent: template.htmlContent,
          thumbnailUrl: template.thumbnailUrl,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }
      };
    }
    
    // Normal Supabase flow
    const { data, error } = await supabase
      .from('templates')
      .select<string, TemplatesTable>()
      .eq('id', templateId)
      .single();
    
    if (error) {
      throw error;
    }
    
    const pathParts = data.html_url.split('/');
    const storagePath = pathParts.slice(-3).join('/');
    
    const { data: htmlFile, success, error: downloadError } = await downloadFile(
      StorageBucket.TEMPLATES,
      storagePath
    );
    
    if (!success || !htmlFile) {
      throw downloadError || new Error('Failed to download template HTML');
    }
    
    const htmlContent = await htmlFile.text();
    
    return {
      success: true,
      template: {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        htmlContent,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    };
  } catch (err) {
    console.error('Error fetching template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error fetching template') 
    };
  }
};

export const updateTemplate = async (
  templateId: string,
  updates: {
    name?: string;
    htmlContent?: string;
    description?: string;
    category?: string;
    thumbnailImage?: File;
  },
  userId?: string,
  username?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select<string, TemplatesTable>()
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (updates.htmlContent) {
      const currentFilename = template.html_url.split('/').pop() || '';
      const filename = updates.name 
        ? `${updates.name.toLowerCase().replace(/\s+/g, '-')}.html`
        : currentFilename;
      
      const htmlFile = new File(
        [new Blob([updates.htmlContent], { type: 'text/html' })],
        filename,
        { type: 'text/html' }
      );
      
      const filePath = `${user.id}/${templateId}/${filename}`;
      
      await uploadFile(
        StorageBucket.TEMPLATES,
        filePath,
        htmlFile,
        { upsert: true }
      );
      
      // Notify collaborators about the template edit
      if (userId && username) {
        await fluvioService.sendTemplateEdit({
          templateId,
          userId,
          username,
          timestamp: Date.now(),
          operation: 'replace',
          content: updates.htmlContent
        });
      }
    }
    
    let thumbnailUrl = template.thumbnail_url;
    
    if (updates.thumbnailImage) {
      const fileExt = updates.thumbnailImage.name.split('.').pop();
      const thumbPath = `${user.id}/${templateId}/thumbnail.${fileExt}`;
      
      const { success } = await uploadFile(
        StorageBucket.TEMPLATES,
        thumbPath,
        updates.thumbnailImage,
        { upsert: true }
      );
      
      if (success) {
        thumbnailUrl = getPublicUrl(StorageBucket.TEMPLATES, thumbPath);
      }
    } 
    else if (updates.htmlContent) {
      try {
        const thumbDataUrl = await generateThumbnail(updates.htmlContent);
        
        if (thumbDataUrl) {
          const thumbFile = dataUrlToFile(thumbDataUrl, `${templateId}-thumb.jpg`);
          const thumbPath = `${user.id}/${templateId}/thumbnail.jpg`;
          
          const { success } = await uploadFile(
            StorageBucket.TEMPLATES,
            thumbPath,
            thumbFile,
            { upsert: true }
          );
          
          if (success) {
            thumbnailUrl = getPublicUrl(StorageBucket.TEMPLATES, thumbPath);
          }
        }
      } catch (err) {
        console.warn('Error generating thumbnail, keeping existing one:', err);
      }
    }
    
    const dbUpdates: any = { 
      updated_at: new Date().toISOString() 
    };
    
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.category) dbUpdates.category = updates.category;
    if (thumbnailUrl !== template.thumbnail_url) dbUpdates.thumbnail_url = thumbnailUrl;
    
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('templates')
      .update(dbUpdates)
      .eq('id', templateId)
      .select<string, TemplatesTable>()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return {
      success: true,
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        thumbnailUrl: updatedTemplate.thumbnail_url,
        updatedAt: updatedTemplate.updated_at
      }
    };
  } catch (err) {
    console.error('Error updating template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Failed to update template') 
    };
  }
};

export const deleteTemplate = async (templateId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select<string, TemplatesTable>()
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    const { data: files } = await listFiles(
      StorageBucket.TEMPLATES,
      `${user.id}/${templateId}`
    );
    
    if (files && files.length > 0) {
      await deleteFile(StorageBucket.TEMPLATES, `${user.id}/${templateId}`);
    }
    
    const { error: dbError } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);
    
    if (dbError) {
      throw dbError;
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error deleting template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Failed to delete template') 
    };
  }
};

export const getUserTemplates = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is not authenticated, return empty templates with offline mode
    // instead of throwing an error
    if (!user) {
      console.log('User not authenticated, returning empty template list');
      return {
        success: true,
        offline: true,
        templates: []
      };
    }
    
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      // Filter templates for the current user
      const userTemplates = Array.from(localStorageFallback.templates.values())
        .filter(template => template.userId === user.id)
        .map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          thumbnailUrl: template.thumbnailUrl,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }));
      
      return {
        success: true,
        offline: true, // Mark this as coming from offline storage
        templates: userTemplates
      };
    }
    
    // Normal Supabase flow
    const { data: templates, error } = await supabase
      .from('templates')
      .select<string, TemplatesTable>()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      offline: false, // Mark this as coming from online storage
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnailUrl: template.thumbnail_url,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }))
    };
  } catch (err) {
    console.error('Error fetching user templates:', err);
    return { 
      success: false, 
      offline: navigator.onLine ? false : true, // Check browser online status
      error: err instanceof Error ? err : new Error('Failed to get user templates') 
    };
  }
};

/**
 * Subscribe to collaborative edits for a template
 * @param templateId - ID of the template to watch for edits
 * @param callback - Function to call when template edits are received
 * @returns Unsubscribe function
 */
export const subscribeToTemplateEdits = (
  templateId: string,
  callback: (edit: any) => void
) => {
  return fluvioService.subscribeToTemplateEdits(templateId, callback);
};

/**
 * Subscribe to cursor position updates for collaborative editing
 * @param templateId - ID of the template to watch for cursor updates
 * @param callback - Function to call when cursor positions are updated
 * @returns Unsubscribe function
 */
export const subscribeToCursorUpdates = (
  templateId: string,
  callback: (update: any) => void
) => {
  return fluvioService.subscribeToCursorUpdates(templateId, callback);
};

/**
 * Update cursor position for collaborative editing
 * @param templateId - ID of the template being edited
 * @param userId - ID of the user
 * @param username - Username of the user
 * @param position - Cursor position in the document
 */
export const updateCursorPosition = async (
  templateId: string,
  userId: string,
  username: string,
  position: number
) => {
  await fluvioService.sendCursorPosition(templateId, userId, username, position);
};

/**
 * Apply a collaborative edit to a template
 * @param templateId - ID of the template to edit
 * @param userId - ID of the user making the edit
 * @param username - Username of the user making the edit
 * @param operation - Type of edit operation
 * @param position - Position in the document for the edit
 * @param length - Length of content to replace/delete
 * @param content - New content to insert
 */
export const applyTemplateEdit = async (
  templateId: string,
  userId: string,
  username: string,
  operation: 'insert' | 'delete' | 'replace',
  position?: number,
  length?: number,
  content?: string
) => {
  await fluvioService.sendTemplateEdit({
    templateId,
    userId,
    username,
    timestamp: Date.now(),
    operation,
    position,
    length,
    content
  });
};