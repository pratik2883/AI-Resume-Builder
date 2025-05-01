import React, { useState } from 'react';
import { useCollaboration } from '@/hooks/use-collaboration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, MessageSquare, Users, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CollaborationPanelProps {
  resumeId: number;
}

export function CollaborationPanel({ resumeId }: CollaborationPanelProps) {
  const {
    isConnected,
    activeUsers,
    comments,
    addComment,
    resolveComment,
  } = useCollaboration(resumeId);
  
  const [activeTab, setActiveTab] = useState('collaborators');
  const [newCommentSection, setNewCommentSection] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('view');
  
  const handleAddComment = () => {
    if (newCommentContent.trim() && newCommentSection) {
      addComment(newCommentSection, newCommentContent);
      setNewCommentContent('');
      setIsAddingComment(false);
    }
  };
  
  const handleShareResume = async () => {
    if (!inviteEmail) return;
    
    try {
      const response = await fetch(`/api/resumes/${resumeId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          permission: invitePermission,
        }),
      });
      
      if (response.ok) {
        setInviteEmail('');
        setShowShareDialog(false);
      } else {
        const error = await response.json();
        console.error('Failed to add collaborator:', error);
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
    }
  };
  
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="border rounded-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Collaboration</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "outline" : "destructive"} className={isConnected ? "text-green-500 border-green-500" : ""}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setShowShareDialog(true)}>
            Share
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="collaborators" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="collaborators">
            <Users className="h-4 w-4 mr-2" />
            Collaborators ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments ({comments.filter(c => !c.resolved).length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="collaborators" className="flex-1">
          <ScrollArea className="h-[300px] pr-4">
            {activeUsers.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                No active users
              </div>
            ) : (
              <div className="space-y-3">
                {activeUsers.map(user => (
                  <div key={user.userId} className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.username}</p>
                    </div>
                    <Badge variant="outline">Online</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="comments" className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                No comments yet
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className={`p-3 rounded ${comment.resolved ? 'bg-muted/50' : 'bg-secondary/20'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{getInitials(comment.username)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{comment.username}</span>
                      </div>
                      {comment.resolved ? (
                        <Badge variant="outline" className="text-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
                          onClick={() => resolveComment(comment.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="pl-8">
                      <p className="text-sm">{comment.content}</p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {comment.section}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="mt-4">
            {isAddingComment ? (
              <div className="space-y-2">
                <Input
                  placeholder="Type your comment..."
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddComment}>Add Comment</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingComment(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setIsAddingComment(true);
                  setNewCommentSection('personalInfo');
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Resume</DialogTitle>
            <DialogDescription>
              Invite others to view or edit this resume
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                placeholder="colleague@example.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={invitePermission}
                onChange={(e) => setInvitePermission(e.target.value)}
              >
                <option value="view">Can View</option>
                <option value="comment">Can Comment</option>
                <option value="edit">Can Edit</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>Cancel</Button>
            <Button onClick={handleShareResume}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}