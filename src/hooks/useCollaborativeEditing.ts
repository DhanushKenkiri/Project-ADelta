import { useState, useEffect, useRef, useCallback } from 'react';
import { fluvioService, TemplateEdit } from '../lib/fluvioService';

interface CursorPosition {
  userId: string;
  username: string;
  position: number;
  color: string;
}

interface UseCollaborativeEditingProps {
  templateId: string;
  initialContent: string;
  userId: string;
  username: string;
  onContentChange?: (content: string) => void;
}

interface UseCollaborativeEditingResult {
  content: string;
  setContent: (content: string) => void;
  cursorPositions: CursorPosition[];
  isCollaborationEnabled: boolean;
  handleSelectionChange: () => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
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

export const useCollaborativeEditing = ({
  templateId,
  initialContent,
  userId,
  username,
  onContentChange
}: UseCollaborativeEditingProps): UseCollaborativeEditingResult => {
  const [content, setContentState] = useState(initialContent);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [lastLocalOperation, setLastLocalOperation] = useState<TemplateEdit | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize collaborative editing
  useEffect(() => {
    try {
      // Check if Fluvio is enabled and supported on this platform
      const isEnabled = fluvioService && typeof fluvioService.isFluvioEnabled === 'function' && fluvioService.isFluvioEnabled();
      setIsCollaborationEnabled(!!isEnabled);

      if (!isEnabled) {
        console.log('Collaborative editing is disabled or not supported in this environment');
        return;
      }

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
        .catch(error => console.error('Error sending initial cursor position:', error));

      // Cleanup subscriptions
      return () => {
        try {
          unsubscribeEdits();
          unsubscribeCursors();
        } catch (error) {
          console.error('Error unsubscribing from collaborative editing:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up collaborative editing:', error);
      setIsCollaborationEnabled(false);
      return undefined;
    }
  }, [templateId, userId, username]);

  // Handle remote edits from other users
  const handleRemoteEdit = useCallback((edit: TemplateEdit) => {
    try {
      // Ignore our own edits that we've already applied locally
      if (edit.userId === userId && lastLocalOperation && 
          lastLocalOperation.timestamp === edit.timestamp) {
        return;
      }

      setContentState(prevContent => {
        if (edit.operation === 'insert' && edit.position !== undefined && edit.content) {
          const newContent = prevContent.substring(0, edit.position) + 
                  edit.content + 
                  prevContent.substring(edit.position);
          if (onContentChange) {
            onContentChange(newContent);
          }
          return newContent;
        } else if (edit.operation === 'delete' && 
                  edit.position !== undefined && 
                  edit.length !== undefined) {
          const newContent = prevContent.substring(0, edit.position) + 
                  prevContent.substring(edit.position + edit.length);
          if (onContentChange) {
            onContentChange(newContent);
          }
          return newContent;
        } else if (edit.operation === 'replace' && 
                  edit.position !== undefined && 
                  edit.length !== undefined && 
                  edit.content) {
          const newContent = prevContent.substring(0, edit.position) + 
                  edit.content + 
                  prevContent.substring(edit.position + edit.length);
          if (onContentChange) {
            onContentChange(newContent);
          }
          return newContent;
        }
        return prevContent;
      });
    } catch (error) {
      console.error('Error handling remote edit:', error);
    }
  }, [userId, lastLocalOperation, onContentChange]);

  // Handle remote cursor updates from other users
  const handleRemoteCursorUpdate = useCallback((edit: TemplateEdit) => {
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
    } catch (error) {
      console.error('Error handling cursor update:', error);
    }
  }, [userId]);

  // Set content and send edit to server
  const setContent = useCallback((newContent: string) => {
    const oldContent = content;
    setContentState(newContent);
    
    // Send the edit to the server if collaboration is enabled
    if (isCollaborationEnabled) {
      try {
        // This is a simple implementation that sends the entire content
        // In a production implementation, you would compute the diff and send only the changes
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
        fluvioService.sendTemplateEdit(edit).catch(error => {
          console.error('Error sending template edit:', error);
        });
      } catch (error) {
        console.error('Error preparing template edit:', error);
      }
    }
    
    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [content, isCollaborationEnabled, templateId, userId, username, onContentChange]);

  // Handle cursor position changes
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || !isCollaborationEnabled) return;
    
    try {
      const position = editorRef.current.selectionStart;
      if (position !== cursorPosition) {
        setCursorPosition(position);
        fluvioService.sendCursorPosition(templateId, userId, username, position)
          .catch(error => {
            console.error('Error sending cursor position:', error);
          });
      }
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  }, [isCollaborationEnabled, templateId, userId, username, cursorPosition]);

  return {
    content,
    setContent,
    cursorPositions,
    isCollaborationEnabled,
    handleSelectionChange,
    editorRef
  };
};

export default useCollaborativeEditing; 