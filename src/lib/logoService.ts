/**
 * LogoService - Integration with Logo.dev API
 * 
 * This service extracts company/organization names from input text
 * and fetches appropriate logos from the Logo.dev API.
 */

// Supported logo styles
export type LogoStyle = 'colored' | 'monochrome' | 'black' | 'white';

/**
 * Extract potential organization names from the input text
 * This uses a simple heuristic to identify company names
 */
export function extractOrganizationNames(text: string): string[] {
  if (!text) return [];
  
  // Common company identifiers
  const companyIdentifiers = [
    'company', 'inc', 'corp', 'corporation', 'ltd', 'limited',
    'llc', 'plc', 'co', 'group', 'holdings', 'technologies',
    'tech', 'software', 'solutions', 'labs', 'media', 'global'
  ];
  
  // Split the text into words and analyze
  const words = text.split(/\s+/);
  const possibleCompanies: string[] = [];
  let currentCompany = '';
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[,."'!?;:()\[\]{}]/g, '').toLowerCase();
    
    // Check for capitalized words that might be part of a company name
    if (/^[A-Z]/.test(words[i]) || companyIdentifiers.includes(word)) {
      if (currentCompany === '') {
        currentCompany = words[i];
      } else {
        currentCompany += ' ' + words[i];
      }
      
      // Check if this might be the end of a company name
      if (companyIdentifiers.includes(word) || 
          (i < words.length - 1 && 
           !/^[A-Z]/.test(words[i+1]) && 
           !companyIdentifiers.includes(words[i+1].toLowerCase()))) {
        possibleCompanies.push(currentCompany);
        currentCompany = '';
      }
    } else if (currentCompany !== '') {
      // End the current company name if we hit a non-capitalized word
      possibleCompanies.push(currentCompany);
      currentCompany = '';
    }
  }
  
  // Add the last company name if we were building one
  if (currentCompany !== '') {
    possibleCompanies.push(currentCompany);
  }
  
  // Also look for specific company patterns like "Company Name, Inc" or "Brand by Company"
  const companyPatterns = [
    /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)+)(?:\s+Inc\.?| Corp\.?| LLC| Ltd\.?)/g,
    /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)+)/g
  ];
  
  for (const pattern of companyPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 3) { // Avoid short matches
        possibleCompanies.push(match[1]);
      }
    }
  }
  
  // Remove duplicates and return
  return [...new Set(possibleCompanies)];
}

/**
 * Generate a logo URL from Logo.dev API
 */
export function generateLogoUrl(
  organizationName: string,
  style: LogoStyle = 'colored',
  size: number = 200
): string {
  // Clean the organization name for URL
  const cleanName = encodeURIComponent(organizationName.trim());
  
  // Construct the Logo.dev URL
  return `https://logo.clearbit.com/${cleanName}.com?size=${size}&${style !== 'colored' ? `format=${style}` : ''}`;
}

/**
 * Get the most likely organization from the input and return its logo URL
 */
export function getOrganizationLogo(
  inputText: string,
  style: LogoStyle = 'colored',
  size: number = 200
): string | null {
  const organizations = extractOrganizationNames(inputText);
  
  // If we found at least one organization, return its logo
  if (organizations.length > 0) {
    console.log('Detected organization:', organizations[0]);
    return generateLogoUrl(organizations[0], style, size);
  }
  
  return null;
}

/**
 * Check if a logo URL is valid (returns a 200 status)
 */
export async function isLogoUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking logo URL:', error);
    return false;
  }
}

export default {
  extractOrganizationNames,
  generateLogoUrl,
  getOrganizationLogo,
  isLogoUrlValid
}; 
 * LogoService - Integration with Logo.dev API
 * 
 * This service extracts company/organization names from input text
 * and fetches appropriate logos from the Logo.dev API.
 */

// Supported logo styles
export type LogoStyle = 'colored' | 'monochrome' | 'black' | 'white';

/**
 * Extract potential organization names from the input text
 * This uses a simple heuristic to identify company names
 */
export function extractOrganizationNames(text: string): string[] {
  if (!text) return [];
  
  // Common company identifiers
  const companyIdentifiers = [
    'company', 'inc', 'corp', 'corporation', 'ltd', 'limited',
    'llc', 'plc', 'co', 'group', 'holdings', 'technologies',
    'tech', 'software', 'solutions', 'labs', 'media', 'global'
  ];
  
  // Split the text into words and analyze
  const words = text.split(/\s+/);
  const possibleCompanies: string[] = [];
  let currentCompany = '';
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[,."'!?;:()\[\]{}]/g, '').toLowerCase();
    
    // Check for capitalized words that might be part of a company name
    if (/^[A-Z]/.test(words[i]) || companyIdentifiers.includes(word)) {
      if (currentCompany === '') {
        currentCompany = words[i];
      } else {
        currentCompany += ' ' + words[i];
      }
      
      // Check if this might be the end of a company name
      if (companyIdentifiers.includes(word) || 
          (i < words.length - 1 && 
           !/^[A-Z]/.test(words[i+1]) && 
           !companyIdentifiers.includes(words[i+1].toLowerCase()))) {
        possibleCompanies.push(currentCompany);
        currentCompany = '';
      }
    } else if (currentCompany !== '') {
      // End the current company name if we hit a non-capitalized word
      possibleCompanies.push(currentCompany);
      currentCompany = '';
    }
  }
  
  // Add the last company name if we were building one
  if (currentCompany !== '') {
    possibleCompanies.push(currentCompany);
  }
  
  // Also look for specific company patterns like "Company Name, Inc" or "Brand by Company"
  const companyPatterns = [
    /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)+)(?:\s+Inc\.?| Corp\.?| LLC| Ltd\.?)/g,
    /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)+)/g
  ];
  
  for (const pattern of companyPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 3) { // Avoid short matches
        possibleCompanies.push(match[1]);
      }
    }
  }
  
  // Remove duplicates and return
  return [...new Set(possibleCompanies)];
}

/**
 * Generate a logo URL from Logo.dev API
 */
export function generateLogoUrl(
  organizationName: string,
  style: LogoStyle = 'colored',
  size: number = 200
): string {
  // Clean the organization name for URL
  const cleanName = encodeURIComponent(organizationName.trim());
  
  // Construct the Logo.dev URL
  return `https://logo.clearbit.com/${cleanName}.com?size=${size}&${style !== 'colored' ? `format=${style}` : ''}`;
}

/**
 * Get the most likely organization from the input and return its logo URL
 */
export function getOrganizationLogo(
  inputText: string,
  style: LogoStyle = 'colored',
  size: number = 200
): string | null {
  const organizations = extractOrganizationNames(inputText);
  
  // If we found at least one organization, return its logo
  if (organizations.length > 0) {
    console.log('Detected organization:', organizations[0]);
    return generateLogoUrl(organizations[0], style, size);
  }
  
  return null;
}

/**
 * Check if a logo URL is valid (returns a 200 status)
 */
export async function isLogoUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking logo URL:', error);
    return false;
  }
}

export default {
  extractOrganizationNames,
  generateLogoUrl,
  getOrganizationLogo,
  isLogoUrlValid
}; 
 