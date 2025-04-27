import { 
  uploadFile, 
  downloadFile, 
  getPublicUrl, 
  listFiles, 
  deleteFile, 
  StorageBucket, 
  isStorageAccessible 
} from '@/integrations/vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { generateThumbnail, dataUrlToFile } from './thumbnailService';
import { fluvioService } from '@/lib/fluvioService';
import {
  getLocalTemplates,
  saveLocalTemplate,
  getLocalTemplateById,
  deleteLocalTemplate,
  getUserLocalTemplates,
  LocalTemplate,
  getLocalUserId,
  storeHtmlContent,
  retrieveHtmlContent
} from './localStorageService';

// In-memory storage for templates metadata
const templatesDb = {
  templates: new Map<string, {
    id: string;
    name: string;
    description: string;
    category: string;
    htmlUrl: string;
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

// Helper function to check if we should use fallback storage
const shouldUseFallback = async (): Promise<boolean> => {
  try {
    const storageAvailable = await isStorageAccessible();
    if (!storageAvailable.success) {
      console.log('Using local fallback storage since Vercel Blob is not accessible');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Error checking storage accessibility:', error);
    return true;
  }
};

// Helper to get user info - in a real app, this would come from auth
const getCurrentUser = async () => {
  // Here you would add your authentication logic
  // For now, use the persistent local user ID
  return {
    id: getLocalUserId(),
    email: 'user@example.com'
  };
};

export const saveTemplate = async (
  name: string,
  htmlContent: string,
  description: string = '',
  category: string = 'general',
  thumbnailImage?: File
) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const templateId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      // Use localStorage fallback
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
      
      // Store HTML content separately to handle large templates
      storeHtmlContent(templateId, htmlContent);
      
      // Create template metadata
      const template: LocalTemplate = {
        id: templateId,
        name,
        description,
        category,
        htmlContent: '', // We don't store the actual content in the metadata
        thumbnailUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId: user.id
      };
      
      // Save to localStorage
      saveLocalTemplate(template);
      
      return {
        success: true,
        template: {
          id: templateId,
          name,
          description,
          category,
          htmlUrl: `local://${templateId}`,
          thumbnailUrl
        }
      };
    }
    
    // Normal Vercel Blob flow
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
    const templateFile = new File(
      [new Blob([htmlContent], { type: 'text/html' })],
      `${sanitizedName}.html`, 
      { type: 'text/html' }
    );
    
    const templatePath = `${user.id}/${templateId}/${templateFile.name}`;
    
    // Upload HTML content to Vercel Blob
    const uploadResult = await uploadFile(
      templateFile,
      templatePath,
      StorageBucket.TEMPLATES
    );
    
    if (!uploadResult.url) {
      throw uploadResult.error || new Error('Failed to upload template file');
    }
    
    const templateUrl = uploadResult.url;
    
    let thumbnailUrl = '';
    
    // Upload thumbnail if provided
    if (thumbnailImage) {
      const fileExt = thumbnailImage.name.split('.').pop();
      const thumbnailPath = `${user.id}/${templateId}/thumbnail.${fileExt}`;
      
      const thumbResult = await uploadFile(
        thumbnailImage,
        thumbnailPath,
        StorageBucket.TEMPLATES
      );
      
      if (thumbResult.url) {
        thumbnailUrl = thumbResult.url;
      }
    }
    
    // Generate thumbnail if not provided
    if (!thumbnailUrl) {
      try {
        const thumbDataUrl = await generateThumbnail(htmlContent);
        
        if (thumbDataUrl) {
          const thumbFile = dataUrlToFile(thumbDataUrl, `thumbnail-${templateId}.jpg`);
          const thumbPath = `${user.id}/${templateId}/thumbnail.jpg`;
          
          const genThumbResult = await uploadFile(
            thumbFile,
            thumbPath,
            StorageBucket.TEMPLATES
          );
          
          if (genThumbResult.url) {
            thumbnailUrl = genThumbResult.url;
          }
        }
      } catch (thumbErr) {
        console.error('Error generating thumbnail:', thumbErr);
      }
      
      if (!thumbnailUrl) {
        thumbnailUrl = '/images/default-template-thumbnail.jpg';
      }
    }
    
    // Store template metadata in our in-memory database
    const templateData = {
      id: templateId,
      name,
      description,
      category,
      htmlUrl: templateUrl,
      thumbnailUrl,
      userId: user.id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    templatesDb.templates.set(templateId, templateData);
    
    return {
      success: true,
      template: {
        id: templateData.id,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        htmlUrl: templateData.htmlUrl,
        thumbnailUrl: templateData.thumbnailUrl
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
      const template = getLocalTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template not found in local storage');
      }
      
      // Retrieve the HTML content from separate storage
      const htmlContent = retrieveHtmlContent(templateId);
      
      return {
        success: true,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          htmlContent,
          thumbnailUrl: template.thumbnailUrl,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          userId: template.userId
        }
      };
    }
    
    // Get from our in-memory database
    const template = templatesDb.templates.get(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Fetch HTML content from Vercel Blob
    const templateUrl = template.htmlUrl;
    
    // Fetch template HTML from URL
    const htmlResponse = await fetch(templateUrl);
    const htmlContent = await htmlResponse.text();
    
    return {
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        htmlContent,
        thumbnailUrl: template.thumbnailUrl,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        userId: template.userId
      }
    };
  } catch (err) {
    console.error('Failed to get template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error getting template') 
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
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      const template = getLocalTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template not found in local storage');
      }
      
      if (template.userId !== user.id) {
        throw new Error('You do not have permission to update this template');
      }
      
      // Get existing HTML content
      const existingHtml = retrieveHtmlContent(templateId);
      
      // Update template metadata
      const updatedTemplate: LocalTemplate = {
        ...template,
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.category && { category: updates.category }),
        updatedAt: new Date().toISOString()
      };
      
      // Update HTML content if provided
      if (updates.htmlContent) {
        storeHtmlContent(templateId, updates.htmlContent);
      }
      
      let thumbnailUrl = template.thumbnailUrl;
      
      if (updates.thumbnailImage) {
        try {
          thumbnailUrl = URL.createObjectURL(updates.thumbnailImage);
        } catch (err) {
          console.warn('Could not create object URL for thumbnail in fallback mode');
        }
      } else if (updates.htmlContent && thumbnailUrl === '/images/default-template-thumbnail.jpg') {
        try {
          const thumbDataUrl = await generateThumbnail(updates.htmlContent);
          if (thumbDataUrl) {
            thumbnailUrl = thumbDataUrl;
          }
        } catch (thumbErr) {
          console.error('Error generating thumbnail in fallback mode:', thumbErr);
        }
      }
      
      updatedTemplate.thumbnailUrl = thumbnailUrl;
      
      // Save updated template to localStorage
      saveLocalTemplate(updatedTemplate);
      
      return {
        success: true,
        template: {
          id: updatedTemplate.id,
          name: updatedTemplate.name,
          description: updatedTemplate.description,
          category: updatedTemplate.category,
          htmlUrl: `local://${templateId}`,
          thumbnailUrl: updatedTemplate.thumbnailUrl
        }
      };
    }
    
    // Get template from our in-memory database
    const template = templatesDb.templates.get(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    if (template.userId !== user.id) {
      throw new Error('You do not have permission to update this template');
    }
    
    const timestamp = new Date().toISOString();
    
    // Update HTML content if provided
    let templateUrl = template.htmlUrl;
    
    if (updates.htmlContent) {
      const sanitizedName = (updates.name || template.name).toLowerCase().replace(/\s+/g, '-');
      const templateFile = new File(
        [new Blob([updates.htmlContent], { type: 'text/html' })],
        `${sanitizedName}.html`,
        { type: 'text/html' }
      );
      
      const templatePath = `${user.id}/${templateId}/${templateFile.name}`;
      
      const uploadResult = await uploadFile(
        templateFile,
        templatePath,
        StorageBucket.TEMPLATES
      );
      
      if (uploadResult.url) {
        templateUrl = uploadResult.url;
      }
    }
    
    // Update thumbnail if provided
    let thumbnailUrl = template.thumbnailUrl;
    
    if (updates.thumbnailImage) {
      const fileExt = updates.thumbnailImage.name.split('.').pop();
      const thumbnailPath = `${user.id}/${templateId}/thumbnail.${fileExt}`;
      
      const thumbResult = await uploadFile(
        updates.thumbnailImage,
        thumbnailPath,
        StorageBucket.TEMPLATES
      );
      
      if (thumbResult.url) {
        thumbnailUrl = thumbResult.url;
      }
    } else if (updates.htmlContent && thumbnailUrl === '/images/default-template-thumbnail.jpg') {
      try {
        const thumbDataUrl = await generateThumbnail(updates.htmlContent);
        
        if (thumbDataUrl) {
          const thumbFile = dataUrlToFile(thumbDataUrl, `thumbnail-${templateId}.jpg`);
          const thumbPath = `${user.id}/${templateId}/thumbnail.jpg`;
          
          const genThumbResult = await uploadFile(
            thumbFile,
            thumbPath,
            StorageBucket.TEMPLATES
          );
          
          if (genThumbResult.url) {
            thumbnailUrl = genThumbResult.url;
          }
        }
      } catch (thumbErr) {
        console.error('Error generating thumbnail:', thumbErr);
      }
    }
    
    // Update template in our in-memory database
    const updatedTemplate = {
      ...template,
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.category && { category: updates.category }),
      htmlUrl: templateUrl,
      thumbnailUrl,
      updatedAt: timestamp
    };
    
    templatesDb.templates.set(templateId, updatedTemplate);
    
    return {
      success: true,
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        htmlUrl: updatedTemplate.htmlUrl,
        thumbnailUrl: updatedTemplate.thumbnailUrl
      }
    };
  } catch (err) {
    console.error('Failed to update template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error updating template') 
    };
  }
};

export const deleteTemplate = async (templateId: string) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      const template = getLocalTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template not found in local storage');
      }
      
      if (template.userId !== user.id) {
        throw new Error('You do not have permission to delete this template');
      }
      
      // Delete from localStorage
      deleteLocalTemplate(templateId);
      
      // Delete HTML content
      localStorage.removeItem(`template_html_${templateId}`);
      
      return { success: true };
    }
    
    // Get template from our in-memory database
    const template = templatesDb.templates.get(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    if (template.userId !== user.id) {
      throw new Error('You do not have permission to delete this template');
    }
    
    // List all files in the template directory
    const { data: files } = await listFiles(
      `${user.id}/${templateId}`,
      StorageBucket.TEMPLATES
    );
    
    // Delete all files
    for (const file of files) {
      await deleteFile(
        file.name,
        StorageBucket.TEMPLATES
      );
    }
    
    // Remove from our in-memory database
    templatesDb.templates.delete(templateId);
    
    return { success: true };
  } catch (err) {
    console.error('Failed to delete template:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error deleting template') 
    };
  }
};

export const getUserTemplates = async () => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if we need to use fallback
    if (await shouldUseFallback()) {
      // Get user templates from localStorage
      const templates = getUserLocalTemplates();
      
      return {
        success: true,
        templates: templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          thumbnailUrl: t.thumbnailUrl,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }))
      };
    }
    
    // Get templates from our in-memory database
    const templates = Array.from(templatesDb.templates.values())
      .filter(t => t.userId === user.id)
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        thumbnailUrl: t.thumbnailUrl,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));
    
    return {
      success: true,
      templates
    };
  } catch (err) {
    console.error('Failed to get user templates:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error getting templates') 
    };
  }
};

// The following functions remain largely unchanged as they don't interact with storage directly

export const subscribeToTemplateEdits = (
  templateId: string,
  callback: (edit: any) => void
) => {
  return fluvioService.subscribeToTemplateEdits(templateId, callback);
};

export const subscribeToCursorUpdates = (
  templateId: string,
  callback: (update: any) => void
) => {
  return fluvioService.subscribeToCursorUpdates(templateId, callback);
};

export const updateCursorPosition = async (
  templateId: string,
  userId: string,
  username: string,
  position: number
) => {
  return fluvioService.sendCursorPosition(templateId, userId, username, position);
};

export const applyTemplateEdit = async (
  templateId: string,
  userId: string,
  username: string,
  operation: 'insert' | 'delete' | 'replace',
  position?: number,
  length?: number,
  content?: string
) => {
  return fluvioService.sendTemplateEdit({
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