import { createContext, ReactNode, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface CollaborationUser {
  userId: number;
  username: string;
}

interface Comment {
  id: number;
  userId: number;
  username: string;
  content: string;
  section: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CursorPosition {
  userId: number;
  username: string;
  section: string;
  position: number;
}

type MessageType = 
  | { type: 'session-info', activeUsers: CollaborationUser[], resumeId: number }
  | { type: 'user-joined', userId: number, username: string, timestamp: string }
  | { type: 'user-left', userId: number, username: string, timestamp: string }
  | { type: 'content-update', section: string, content: any, userId: number, username: string, timestamp: string }
  | { type: 'new-comment', comment: Comment }
  | { type: 'comment-resolved', commentId: number, resolvedBy: { userId: number, username: string }, timestamp: string }
  | { type: 'cursor-position', userId: number, username: string, section: string, position: number }
  | { type: 'error', message: string };

type CollaborationContextType = {
  isConnected: boolean;
  activeUsers: CollaborationUser[];
  comments: Comment[];
  cursorPositions: CursorPosition[];
  sendContentUpdate: (section: string, content: any) => void;
  addComment: (section: string, content: string) => void;
  resolveComment: (commentId: number) => void;
  updateCursorPosition: (section: string, position: number) => void;
  useContentSubscription: (section: string, callback: (content: any) => void) => void;
};

const CollaborationContext = createContext<CollaborationContextType | null>(null);

interface CollaborationProviderProps {
  children: ReactNode;
  resumeId: number | null;
}

export function CollaborationProvider({ children, resumeId }: CollaborationProviderProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const contentUpdateCallbacks = useRef<Map<string, Set<(content: any) => void>>>(new Map());
  
  // Connect to WebSocket when resumeId changes
  useEffect(() => {
    if (!resumeId || !user) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }
    
    // Reset state when resumeId changes
    setActiveUsers([]);
    setComments([]);
    setCursorPositions([]);
    
    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send join message
      if (resumeId) {
        newSocket.send(JSON.stringify({
          type: 'join',
          resumeId,
          userId: user.id,
          username: user.username,
        }));
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message: MessageType = JSON.parse(event.data);
        
        switch (message.type) {
          case 'session-info':
            setActiveUsers(message.activeUsers);
            break;
            
          case 'user-joined':
            setActiveUsers((prev) => {
              if (!prev.some(u => u.userId === message.userId)) {
                return [...prev, { userId: message.userId, username: message.username }];
              }
              return prev;
            });
            break;
            
          case 'user-left':
            setActiveUsers((prev) => prev.filter(u => u.userId !== message.userId));
            setCursorPositions((prev) => prev.filter(c => c.userId !== message.userId));
            break;
            
          case 'content-update':
            // Notify subscribers for this section
            const callbacks = contentUpdateCallbacks.current.get(message.section);
            if (callbacks) {
              callbacks.forEach(callback => {
                callback(message.content);
              });
            }
            break;
            
          case 'new-comment':
            setComments((prev) => [...prev, message.comment]);
            break;
            
          case 'comment-resolved':
            setComments((prev) => prev.map(comment => 
              comment.id === message.commentId
                ? { ...comment, resolved: true }
                : comment
            ));
            break;
            
          case 'cursor-position':
            setCursorPositions((prev) => {
              // Remove any existing cursor for this user and section
              const filtered = prev.filter(c => !(c.userId === message.userId && c.section === message.section));
              // Add the new cursor position
              return [...filtered, { 
                userId: message.userId, 
                username: message.username,
                section: message.section,
                position: message.position 
              }];
            });
            break;
            
          case 'error':
            console.error('Collaboration error:', message.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      if (newSocket && newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [resumeId, user]);
  
  // Fetch initial comments when connected
  useEffect(() => {
    if (!resumeId || !isConnected) return;
    
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        } else {
          console.error('Failed to fetch comments');
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    
    fetchComments();
  }, [resumeId, isConnected]);
  
  // Send content update
  const sendContentUpdate = useCallback((section: string, content: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !resumeId || !user) return;
    
    socket.send(JSON.stringify({
      type: 'content-update',
      resumeId,
      userId: user.id,
      username: user.username,
      section,
      content,
    }));
  }, [socket, resumeId, user]);
  
  // Add comment
  const addComment = useCallback(async (section: string, content: string) => {
    if (!resumeId || !user) return;
    
    try {
      const response = await fetch(`/api/resumes/${resumeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          content,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [resumeId, user]);
  
  // Resolve comment
  const resolveComment = useCallback(async (commentId: number) => {
    if (!resumeId || !user) return;
    
    try {
      const response = await fetch(`/api/resumes/${resumeId}/comments/${commentId}/resolve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        console.error('Failed to resolve comment');
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  }, [resumeId, user]);
  
  // Update cursor position
  const updateCursorPosition = useCallback((section: string, position: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !resumeId || !user) return;
    
    socket.send(JSON.stringify({
      type: 'cursor-position',
      resumeId,
      userId: user.id,
      username: user.username,
      section,
      position,
    }));
  }, [socket, resumeId, user]);
  
  // Subscribe to content updates for a specific section
  const useContentSubscription = useCallback((section: string, callback: (content: any) => void) => {
    useEffect(() => {
      // Register callback
      if (!contentUpdateCallbacks.current.has(section)) {
        contentUpdateCallbacks.current.set(section, new Set());
      }
      
      const callbacks = contentUpdateCallbacks.current.get(section)!;
      callbacks.add(callback);
      
      // Cleanup
      return () => {
        const callbacks = contentUpdateCallbacks.current.get(section);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            contentUpdateCallbacks.current.delete(section);
          }
        }
      };
    }, [section, callback]);
  }, []);
  
  const contextValue: CollaborationContextType = {
    isConnected,
    activeUsers,
    comments,
    cursorPositions,
    sendContentUpdate,
    addComment,
    resolveComment,
    updateCursorPosition,
    useContentSubscription,
  };
  
  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration(resumeId: number | null) {
  const context = useContext(CollaborationContext);
  
  // If resumeId is null or undefined, return a default context with empty values
  if (!resumeId) {
    return {
      isConnected: false,
      activeUsers: [],
      comments: [],
      cursorPositions: [],
      sendContentUpdate: () => {},
      addComment: () => {},
      resolveComment: () => {},
      updateCursorPosition: () => {},
      useContentSubscription: () => {},
    };
  }
  
  // If we're inside the provider, use the context
  if (context) {
    return context;
  }
  
  // If we're not inside the provider, wrap with the provider
  // This is a simplified version that doesn't actually provide the context
  // In a real app, you'd want to use a more robust solution
  return {
    isConnected: false,
    activeUsers: [],
    comments: [],
    cursorPositions: [],
    sendContentUpdate: () => {},
    addComment: () => {},
    resolveComment: () => {},
    updateCursorPosition: () => {},
    useContentSubscription: () => {},
  };
}