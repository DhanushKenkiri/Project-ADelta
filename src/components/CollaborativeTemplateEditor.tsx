import React, { useState, useEffect, useRef } from 'react';
import { fluvioService, TemplateEdit } from '../lib/fluvioService';

interface CollaborativeTemplateEditorProps {
  templateId: string;
  initialContent: string;
  userId: string;
  username: string;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
}

interface CursorPosition {
  userId: string;
  username: string;
  position: number;
  color: string;
}

// Generate a random color for a user
const getUserColor = (userId: string): string => {
  // Simple hash function to get a consistent color for the same user
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#ff5252', '#ff4081', '#e040fb', '#7c4dff', '#536dfe',
    '#448aff', '#40c4ff', '#18ffff', '#64ffda', '#69f0ae',
    '#b2ff59', '#eeff41', '#ffff00', '#ffd740', '#ffab40',
    '#ff6e40'
  ];
  return colors[hash % colors.length];
};

const CollaborativeTemplateEditor: React.FC<CollaborativeTemplateEditorProps> = ({
  templateId,
  initialContent,
  userId,
  username,
  readOnly = false,
  onContentChange
}) => {
  const [content, setContent] = useState(initialContent);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [collaborationError, setCollaborationError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [lastLocalOperation, setLastLocalOperation] = useState<TemplateEdit | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize collaboration
    try {
      const isEnabled = fluvioService && typeof fluvioService.isFluvioEnabled === 'function' && fluvioService.isFluvioEnabled();
      setIsCollaborationEnabled(!!isEnabled);

      if (isEnabled) {
        // Subscribe to template edits
        const unsubscribeEdits = fluvioService.subscribeToTemplateEdits(
          templateId,
          handleRemoteEdit
        );

        // Subscribe to cursor updates
        const unsubscribeCursors = fluvioService.subscribeToCursorUpdates(
          templateId,
          handleRemoteCursorUpdate
        );

        // Send initial cursor position
        fluvioService.sendCursorPosition(templateId, userId, username, 0)
          .catch(err => {
            console.error('Failed to send initial cursor position:', err);
            setCollaborationError('Failed to send cursor position. Collaborative editing may be limited.');
          });

        return () => {
          try {
            unsubscribeEdits();
            unsubscribeCursors();
          } catch (err) {
            console.error('Error unsubscribing from topics:', err);
          }
        };
      }
    } catch (err) {
      console.error('Error initializing collaborative editing:', err);
      setCollaborationError('Collaborative editing is currently unavailable. Changes won\'t be synchronized in real-time.');
      setIsCollaborationEnabled(false);
    }
  }, [templateId, userId, username]);

  // Handle remote edits
  const handleRemoteEdit = (edit: TemplateEdit) => {
    try {
      // Ignore our own edits that we've already applied locally
      if (edit.userId === userId && lastLocalOperation && 
          lastLocalOperation.timestamp === edit.timestamp) {
        return;
      }

      setContent(prevContent => {
        if (edit.operation === 'insert' && edit.position !== undefined && edit.content) {
          return prevContent.substring(0, edit.position) + 
                edit.content + 
                prevContent.substring(edit.position);
        } else if (edit.operation === 'delete' && 
                  edit.position !== undefined && 
                  edit.length !== undefined) {
          return prevContent.substring(0, edit.position) + 
                prevContent.substring(edit.position + edit.length);
        } else if (edit.operation === 'replace' && 
                  edit.position !== undefined && 
                  edit.length !== undefined && 
                  edit.content) {
          return prevContent.substring(0, edit.position) + 
                edit.content + 
                prevContent.substring(edit.position + edit.length);
        }
        return prevContent;
      });
    } catch (err) {
      console.error('Error processing remote edit:', err);
    }
  };

  // Handle remote cursor updates
  const handleRemoteCursorUpdate = (edit: TemplateEdit) => {
    try {
      if (edit.userId === userId) return; // Ignore our own cursor
      
      if (edit.cursorPosition !== undefined) {
        setCursorPositions(prev => {
          const existing = prev.findIndex(p => p.userId === edit.userId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing],
              position: edit.cursorPosition!
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                userId: edit.userId,
                username: edit.username,
                position: edit.cursorPosition!,
                color: getUserColor(edit.userId)
              }
            ];
          }
        });
      }
    } catch (err) {
      console.error('Error processing cursor update:', err);
    }
  };

  // Handle content changes and send them to the server
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;
    setContent(newContent);
    
    // Send the edit to the server if collaboration is enabled
    if (isCollaborationEnabled) {
      try {
        // This is a simple implementation that sends the entire content
        // In a real implementation, you would compute the diff and send only the changes
        const edit: TemplateEdit = {
          templateId,
          userId,
          username,
          timestamp: Date.now(),
          operation: 'replace',
          position: 0,
          length: oldContent.length,
          content: newContent
        };
        
        setLastLocalOperation(edit);
        fluvioService.sendTemplateEdit(edit)
          .catch(err => {
            console.error('Failed to send template edit:', err);
            setCollaborationError('Failed to sync your changes. You can continue editing, but others may not see your updates.');
          });
      } catch (err) {
        console.error('Error sending template edit:', err);
        setCollaborationError('Failed to sync your changes. You can continue editing, but others may not see your updates.');
      }
    }
    
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  // Handle cursor position changes
  const handleSelectionChange = () => {
    if (!editorRef.current || !isCollaborationEnabled) return;
    
    try {
      const position = editorRef.current.selectionStart;
      if (position !== cursorPosition) {
        setCursorPosition(position);
        fluvioService.sendCursorPosition(templateId, userId, username, position)
          .catch(err => {
            console.error('Failed to send cursor position:', err);
            // We don't set collaboration error here to avoid too many error messages
            // as cursor position updates frequently
          });
      }
    } catch (err) {
      console.error('Error handling selection change:', err);
    }
  };

  // Render cursor indicators for other users
  const renderCursorIndicators = () => {
    if (!editorRef.current) return null;
    
    try {
      // Calculate positions for cursors based on the current text
      const computePositionStyle = (position: number) => {
        const text = content.substring(0, position);
        const lines = text.split('\n');
        const lineIndex = lines.length - 1;
        const charIndex = lines[lineIndex].length;
        
        // This is a very simplified approach - in a real editor you would
        // need to measure the actual text dimensions
        const lineHeight = 20; // px
        const charWidth = 8; // px
        
        return {
          top: lineIndex * lineHeight,
          left: charIndex * charWidth
        };
      };
      
      return cursorPositions.map(cursor => (
        <div 
          key={cursor.userId}
          className="absolute pointer-events-none"
          style={{
            ...computePositionStyle(cursor.position),
            width: '2px',
            height: '20px',
            backgroundColor: cursor.color,
            transition: 'all 0.2s ease'
          }}
        >
          <div 
            className="absolute top-0 left-0 text-xs text-white px-1 py-0.5 rounded whitespace-nowrap transform -translate-y-full"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.username}
          </div>
        </div>
      ));
    } catch (err) {
      console.error('Error rendering cursor indicators:', err);
      return null;
    }
  };

  return (
    <div className="relative">
      {isCollaborationEnabled ? (
        <div className="mb-2 text-sm bg-blue-50 text-blue-700 p-2 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Collaborative editing active - changes are synchronized in real-time</span>
          </div>
          {cursorPositions.length > 0 && (
            <div className="mt-1">
              <span>Users editing: </span>
              {cursorPositions.map(cursor => (
                <span 
                  key={cursor.userId} 
                  className="inline-block mr-2 px-1.5 rounded text-white"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.username}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2 text-sm bg-yellow-50 text-yellow-700 p-2 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Local editing mode - your changes won't be shared with others</span>
          </div>
        </div>
      )}

      {collaborationError && (
        <div className="mb-2 text-sm bg-red-50 text-red-700 p-2 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{collaborationError}</span>
          </div>
        </div>
      )}
      
      <div className="relative border rounded-md">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          className="w-full min-h-[300px] p-3 font-mono text-sm resize-y rounded-md"
          readOnly={readOnly}
        />
        {isCollaborationEnabled && renderCursorIndicators()}
      </div>
    </div>
  );
};

export default CollaborativeTemplateEditor; 