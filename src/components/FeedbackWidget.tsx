import React, { useState } from 'react';
import { feedbackLoop, FeedbackRating } from '../lib/feedbackLoop';

interface FeedbackWidgetProps {
  eventId: string;
  outputContent: string;
  onFeedbackSubmit?: (feedback: FeedbackRating) => void;
  position?: 'bottom' | 'top' | 'right' | 'left';
  theme?: 'light' | 'dark';
  compact?: boolean;
}

/**
 * FeedbackWidget - A component to collect user feedback about AI-generated content
 */
const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  eventId,
  outputContent,
  onFeedbackSubmit,
  position = 'bottom',
  theme = 'dark',
  compact = false
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [improvement, setImprovement] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isThankYouVisible, setIsThankYouVisible] = useState(false);

  // Feedback categories
  const feedbackCategories = [
    'Accuracy',
    'Clarity',
    'Format',
    'Completeness',
    'Relevance',
    'Tone',
    'Helpfulness',
    'Other'
  ];

  // Handle star rating click
  const handleRatingClick = (value: number) => {
    setRating(value);
    
    // If we're in compact mode, auto-expand after rating
    if (compact && !isExpanded) {
      setIsExpanded(true);
    }
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Submit the feedback
  const handleSubmit = () => {
    if (rating === null) return;
    
    const feedback: FeedbackRating = {
      rating,
      comments: comment.trim(),
      categories: selectedCategories,
      improvedVersion: improvement.trim()
    };
    
    // Log the feedback to the feedback loop system
    feedbackLoop.logFeedback(eventId, feedback);
    
    // Call the onFeedbackSubmit callback if provided
    if (onFeedbackSubmit) {
      onFeedbackSubmit(feedback);
    }
    
    // Reset the form
    setIsSubmitted(true);
    setIsThankYouVisible(true);
    
    // Hide the thank you message after a delay
    setTimeout(() => {
      setIsThankYouVisible(false);
    }, 3000);
  };

  // Get CSS classes for positioning and theme
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'right':
        return 'right-4 top-1/2 transform -translate-y-1/2';
      case 'left':
        return 'left-4 top-1/2 transform -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
    }
  };

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-neutral-800 text-gray-200 border-neutral-700' 
      : 'bg-white text-gray-800 border-gray-200';
  };

  // Render the component
  return (
    <div className={`fixed ${getPositionClasses()} z-50 transition-all duration-300`}>
      {isThankYouVisible ? (
        <div className={`p-4 rounded-md shadow-lg ${getThemeClasses()} transition-opacity`}>
          <p className="text-center font-medium">
            Thank you for your feedback!
          </p>
        </div>
      ) : !isSubmitted ? (
        <div className={`shadow-lg rounded-md border ${getThemeClasses()} overflow-hidden transition-all duration-300`}
             style={{ width: compact && !isExpanded ? '200px' : '320px' }}>
          <div className="p-4">
            <h3 className="text-center font-medium mb-2">
              {compact ? 'Rate this response' : 'How helpful was this response?'}
            </h3>
            
            {/* Star Rating */}
            <div className="flex justify-center space-x-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`p-1 rounded focus:outline-none transition-all ${
                    rating && rating >= star 
                      ? 'text-yellow-400 transform scale-110' 
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                  onClick={() => handleRatingClick(star)}
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-6 h-6"
                  >
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Expanded Form */}
            {(isExpanded || !compact) && rating !== null && (
              <div className="mt-3 space-y-3 animate-fadeIn">
                {/* Categories */}
                <div>
                  <p className="text-sm mb-1 font-medium">What could be improved?</p>
                  <div className="flex flex-wrap gap-2">
                    {feedbackCategories.map((category) => (
                      <button
                        key={category}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          selectedCategories.includes(category)
                            ? theme === 'dark' 
                              ? 'bg-indigo-900 border-indigo-700 text-indigo-200' 
                              : 'bg-indigo-100 border-indigo-300 text-indigo-800'
                            : theme === 'dark'
                              ? 'border-neutral-600 hover:border-neutral-500' 
                              : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => toggleCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Comment */}
                <div>
                  <p className="text-sm mb-1 font-medium">Additional comments</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike?"
                    className={`w-full p-2 rounded text-sm ${
                      theme === 'dark' 
                        ? 'bg-neutral-700 border-neutral-600 focus:border-neutral-500' 
                        : 'bg-gray-50 border-gray-300 focus:border-gray-400'
                    } border`}
                    rows={2}
                  />
                </div>
                
                {/* Improvement suggestion */}
                {rating <= 3 && (
                  <div>
                    <p className="text-sm mb-1 font-medium">Suggest an improved version</p>
                    <textarea
                      value={improvement}
                      onChange={(e) => setImprovement(e.target.value)}
                      placeholder="How would you improve this response?"
                      className={`w-full p-2 rounded text-sm ${
                        theme === 'dark' 
                          ? 'bg-neutral-700 border-neutral-600 focus:border-neutral-500' 
                          : 'bg-gray-50 border-gray-300 focus:border-gray-400'
                      } border`}
                      rows={3}
                    />
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  {!compact && (
                    <button 
                      className="mr-2 px-3 py-1.5 rounded text-sm font-medium text-gray-400 hover:text-gray-300"
                      onClick={() => setRating(null)}
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                      theme === 'dark'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                    onClick={handleSubmit}
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
            
            {/* Compact Mode: Show Expand Button */}
            {compact && rating !== null && !isExpanded && (
              <div className="mt-2 flex justify-center">
                <button 
                  className={`text-xs px-2 py-1 rounded ${
                    theme === 'dark'
                      ? 'text-indigo-400 hover:text-indigo-300'
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                  onClick={() => setIsExpanded(true)}
                >
                  Add detailed feedback
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FeedbackWidget; 