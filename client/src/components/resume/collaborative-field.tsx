import React, { useEffect, useState, useRef } from 'react';
import { useCollaboration } from '@/hooks/use-collaboration';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CollaborativeCursorWrapper } from './remote-cursor';
import { MessageSquare } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface CollaborativeFieldProps {
  resumeId: number;
  sectionId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
}

export function CollaborativeField({
  resumeId,
  sectionId,
  value,
  onChange,
  placeholder,
  label,
  multiline = false,
  rows = 3,
}: CollaborativeFieldProps) {
  const {
    sendContentUpdate,
    updateCursorPosition,
    addComment,
    useContentSubscription,
  } = useCollaboration(resumeId);
  const [localValue, setLocalValue] = useState(value);
  const [comment, setComment] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const lastUpdateRef = useRef<NodeJS.Timeout | null>(null);
  // Using separate refs for Input and Textarea
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Subscribe to content updates for this field
  useContentSubscription(sectionId, (newContent) => {
    if (typeof newContent === 'string' && newContent !== localValue) {
      setLocalValue(newContent);
      onChange(newContent);
    }
  });
  
  // Sync local value with prop value
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);
  
  // Handle local changes with debouncing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear any pending updates
    if (lastUpdateRef.current) {
      clearTimeout(lastUpdateRef.current);
    }
    
    // Schedule a new update after a short delay (debounce)
    lastUpdateRef.current = setTimeout(() => {
      sendContentUpdate(sectionId, newValue);
      onChange(newValue);
      lastUpdateRef.current = null;
    }, 500);
  };
  
  // Handle cursor position updates
  const handleSelection = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateCursorPosition(sectionId, target.selectionStart || 0);
  };
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (comment.trim()) {
      addComment(sectionId, comment);
      setComment('');
      setCommentOpen(false);
    }
  };
  
  const FieldComponent = multiline ? Textarea : Input;
  
  return (
    <div className="relative group">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex">
        <CollaborativeCursorWrapper resumeId={resumeId} sectionId={sectionId}>
          {multiline ? (
            <Textarea
              ref={textareaRef}
              value={localValue}
              onChange={handleChange}
              onSelect={handleSelection}
              onFocus={handleSelection}
              placeholder={placeholder}
              rows={rows}
              className="w-full pr-8"
            />
          ) : (
            <Input
              ref={inputRef}
              value={localValue}
              onChange={handleChange}
              onSelect={handleSelection}
              onFocus={handleSelection}
              placeholder={placeholder}
              className="w-full pr-8"
            />
          )}
        </CollaborativeCursorWrapper>
        
        <Popover open={commentOpen} onOpenChange={setCommentOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-0 right-0 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Add Comment</h4>
              <Textarea
                placeholder="Type your comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCommentOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddComment}>
                  Add
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}