import React, { useState } from 'react';
import { useFeedback } from './FeedbackProvider';
import { FeedbackRating } from '../lib/feedbackLoop';

export interface FeedbackUIProps {
  eventId: string;
  className?: string;
  compact?: boolean;
}

export const FeedbackUI: React.FC<FeedbackUIProps> = ({
  eventId,
  className = '',
  compact = false
}) => {
  const { submitFeedback, suggestImprovement } = useFeedback();
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const handleRating = (newRating: FeedbackRating) => {
    setRating(newRating);
  };

  const handleSubmit = () => {
    if (rating) {
      submitFeedback(eventId, rating, comment);
      setIsSubmitted(true);
    }
  };

  const handleSuggestion = () => {
    if (suggestion.trim()) {
      suggestImprovement(eventId, suggestion);
      setSuggestion('');
      setShowSuggestion(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`flex flex-col items-start gap-2 p-2 rounded-lg bg-gray-900 border border-gray-800 ${className}`}>
        <p className="text-sm text-gray-300">Thanks for your feedback!</p>
        {!showSuggestion ? (
          <button 
            onClick={() => setShowSuggestion(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Suggest an improvement
          </button>
        ) : (
          <div className="w-full space-y-2">
            <textarea
              className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="How could this response be improved?"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowSuggestion(false)}
                className="px-2 py-1 text-xs text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSuggestion}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
                disabled={!suggestion.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 p-2 rounded-lg bg-gray-900 border border-gray-800 ${className}`}>
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-300">Was this response helpful?</p>
        <div className="flex gap-1">
          <button
            onClick={() => handleRating('positive')}
            className={`p-1 rounded-md ${rating === 'positive' ? 'bg-green-700/30 text-green-400' : 'hover:bg-gray-800 text-gray-400'}`}
            aria-label="Thumbs up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.977a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
            </svg>
          </button>
          <button
            onClick={() => handleRating('negative')}
            className={`p-1 rounded-md ${rating === 'negative' ? 'bg-red-700/30 text-red-400' : 'hover:bg-gray-800 text-gray-400'}`}
            aria-label="Thumbs down"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-180">
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.977a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
            </svg>
          </button>
        </div>
      </div>
      
      {rating && !compact && (
        <div className="space-y-2">
          <textarea
            className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-white"
            placeholder={rating === 'positive' ? "What did you like about it?" : "What could be improved?"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <button 
              onClick={handleSubmit}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Submit
            </button>
          </div>
        </div>
      )}
      
      {rating && compact && (
        <div className="flex justify-end">
          <button 
            onClick={handleSubmit}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}; 