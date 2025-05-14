import React from 'react';
import { Helmet } from 'react-helmet';

interface PageTitleProps {
  title?: string;
}

/**
 * Component to set the browser tab title uniformly as "{pageName} | Project-Aδ"
 */
const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  const displayTitle = title 
    ? `${title} | Project-Aδ` 
    : 'Project-Aδ';
    
  return (
    <Helmet>
      <title>{displayTitle}</title>
    </Helmet>
  );
};

export default PageTitle; 