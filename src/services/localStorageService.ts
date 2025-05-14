/**
 * Local storage service for template storage fallback
 * This service provides persistent storage when Vercel Blob storage is not available
 */

const STORAGE_KEYS = {
  TEMPLATES: 'adelta_templates',
  USER_ID: 'adelta_user_id'
};

export interface LocalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  htmlContent: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

/**
 * Initialize the local user ID if not present
 */
export const initializeLocalUser = (): string => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  if (!userId) {
    // Generate a persistent user ID
    userId = `local-user-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  
  return userId;
};

/**
 * Get the current local user ID
 */
export const getLocalUserId = (): string => {
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  return userId || initializeLocalUser();
};

/**
 * Get all templates from local storage
 */
export const getLocalTemplates = (): Map<string, LocalTemplate> => {
  try {
    const templates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!templates) {
      return new Map<string, LocalTemplate>();
    }
    
    const templateArray = JSON.parse(templates) as LocalTemplate[];
    const templateMap = new Map<string, LocalTemplate>();
    
    templateArray.forEach(template => {
      templateMap.set(template.id, template);
    });
    
    return templateMap;
  } catch (error) {
    console.error('Error reading templates from localStorage:', error);
    return new Map<string, LocalTemplate>();
  }
};

/**
 * Save all templates to local storage
 */
export const saveLocalTemplates = (templates: Map<string, LocalTemplate>): void => {
  try {
    const templateArray = Array.from(templates.values());
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templateArray));
  } catch (error) {
    console.error('Error saving templates to localStorage:', error);
  }
};

/**
 * Save a single template to local storage
 */
export const saveLocalTemplate = (template: LocalTemplate): void => {
  try {
    const templates = getLocalTemplates();
    templates.set(template.id, template);
    saveLocalTemplates(templates);
  } catch (error) {
    console.error('Error saving template to localStorage:', error);
  }
};

/**
 * Get a template by ID from local storage
 */
export const getLocalTemplateById = (id: string): LocalTemplate | undefined => {
  try {
    const templates = getLocalTemplates();
    return templates.get(id);
  } catch (error) {
    console.error('Error getting template from localStorage:', error);
    return undefined;
  }
};

/**
 * Delete a template from local storage
 */
export const deleteLocalTemplate = (id: string): boolean => {
  try {
    const templates = getLocalTemplates();
    const result = templates.delete(id);
    saveLocalTemplates(templates);
    return result;
  } catch (error) {
    console.error('Error deleting template from localStorage:', error);
    return false;
  }
};

/**
 * Get templates for the current user from local storage
 */
export const getUserLocalTemplates = (): LocalTemplate[] => {
  try {
    const userId = getLocalUserId();
    const templates = getLocalTemplates();
    
    return Array.from(templates.values())
      .filter(template => template.userId === userId);
  } catch (error) {
    console.error('Error getting user templates from localStorage:', error);
    return [];
  }
};

/**
 * Compress HTML content to save space in localStorage
 */
export const compressHtml = (html: string): string => {
  try {
    // Simple compression - remove excess whitespace
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  } catch (error) {
    console.error('Error compressing HTML:', error);
    return html;
  }
};

/**
 * Helper function to safely store large HTML content in localStorage
 * by splitting it into chunks if necessary
 */
export const storeHtmlContent = (id: string, html: string): void => {
  try {
    // Store regular-sized templates directly
    if (html.length < 200000) {
      localStorage.setItem(`template_html_${id}`, html);
      return;
    }
    
    // For very large templates, compress it
    const compressed = compressHtml(html);
    localStorage.setItem(`template_html_${id}`, compressed);
    
    // If still too large, we could implement chunking, but that's beyond
    // the scope of this implementation
  } catch (error) {
    console.error('Error storing HTML content in localStorage:', error);
  }
};

/**
 * Helper function to retrieve HTML content from localStorage
 */
export const retrieveHtmlContent = (id: string): string => {
  try {
    return localStorage.getItem(`template_html_${id}`) || '';
  } catch (error) {
    console.error('Error retrieving HTML content from localStorage:', error);
    return '';
  }
}; 