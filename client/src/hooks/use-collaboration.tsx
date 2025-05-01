import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { ResumeContent } from '@shared/schema';

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

export function useCollaboration(resumeId: number | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket server
  useEffect(() => {
    if (!resumeId || !user) return;
    
    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Determine WebSocket protocol (ws:// or wss://)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?resumeId=${resumeId}&userId=${user.id}&username=${user.username}`;
    
    // Create new WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // Define WebSocket event handlers
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (document.visibilityState !== 'hidden') {
          console.log('Attempting to reconnect WebSocket...');
          // The component will re-render and trigger the useEffect again
          setIsConnected(false);
        }
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to collaborative editing server',
        variant: 'destructive',
      });
    };
    
    ws.onmessage = (event) => {
      try {
        const message: MessageType = JSON.parse(event.data);
        
        // Handle different message types
        switch (message.type) {
          case 'session-info':
            setActiveUsers(message.activeUsers);
            break;
            
          case 'user-joined':
            setActiveUsers(prev => [...prev.filter(u => u.userId !== message.userId), { userId: message.userId, username: message.username }]);
            toast({
              title: 'User Joined',
              description: `${message.username} has joined the editing session`,
              variant: 'default',
            });
            break;
            
          case 'user-left':
            setActiveUsers(prev => prev.filter(u => u.userId !== message.userId));
            setCursorPositions(prev => prev.filter(c => c.userId !== message.userId));
            toast({
              title: 'User Left',
              description: `${message.username} has left the editing session`,
              variant: 'default',
            });
            break;
            
          case 'content-update':
            // This will be handled by individual component subscribers
            break;
            
          case 'new-comment':
            setComments(prev => [...prev, message.comment]);
            if (message.comment.userId !== user.id) {
              toast({
                title: 'New Comment',
                description: `${message.comment.username} added a comment`,
                variant: 'default',
              });
            }
            break;
            
          case 'comment-resolved':
            setComments(prev => 
              prev.map(comment => 
                comment.id === message.commentId 
                  ? { ...comment, resolved: true } 
                  : comment
              )
            );
            if (message.resolvedBy.userId !== user.id) {
              toast({
                title: 'Comment Resolved',
                description: `${message.resolvedBy.username} resolved a comment`,
                variant: 'default',
              });
            }
            break;
            
          case 'cursor-position':
            setCursorPositions(prev => {
              const filtered = prev.filter(c => c.userId !== message.userId);
              return [...filtered, {
                userId: message.userId,
                username: message.username,
                section: message.section,
                position: message.position
              }];
            });
            break;
            
          case 'error':
            toast({
              title: 'Error',
              description: message.message,
              variant: 'destructive',
            });
            break;
            
          default:
            console.warn('Unknown message type:', (message as any).type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    // Fetch initial comments for this resume
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}/comments`);
        if (response.ok) {
          const fetchedComments = await response.json();
          setComments(fetchedComments);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    
    fetchComments();
    
    // Clean up on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [resumeId, user, toast]);
  
  // Function to send content updates
  const sendContentUpdate = useCallback((section: string, content: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'content-update',
      section,
      content,
    }));
  }, []);
  
  // Function to add a comment
  const addComment = useCallback((section: string, content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'add-comment',
      section,
      content,
    }));
  }, []);
  
  // Function to resolve a comment
  const resolveComment = useCallback((commentId: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'resolve-comment',
      commentId,
    }));
  }, []);
  
  // Function to update cursor position
  const updateCursorPosition = useCallback((section: string, position: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'cursor-position',
      section,
      position,
    }));
  }, []);
  
  // Function to subscribe to content updates for a specific section
  const useContentSubscription = (section: string, onUpdate: (content: any) => void) => {
    useEffect(() => {
      const handler = (event: MessageEvent) => {
        try {
          const message: MessageType = JSON.parse(event.data);
          
          if (message.type === 'content-update' && message.section === section) {
            onUpdate(message.content);
          }
        } catch (error) {
          console.error('Error processing content subscription:', error);
        }
      };
      
      if (wsRef.current) {
        wsRef.current.addEventListener('message', handler);
      }
      
      return () => {
        if (wsRef.current) {
          wsRef.current.removeEventListener('message', handler);
        }
      };
    }, [section, onUpdate]);
  };
  
  return {
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
}