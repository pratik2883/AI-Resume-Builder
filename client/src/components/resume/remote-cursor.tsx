import React, { useRef, useEffect } from 'react';
import { useCollaboration } from '@/hooks/use-collaboration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RemoteCursorsProps {
  resumeId: number;
  sectionId: string;
  container: HTMLElement | null;
}

export function RemoteCursors({ resumeId, sectionId, container }: RemoteCursorsProps) {
  const { cursorPositions } = useCollaboration(resumeId);
  const cursorsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Filter cursor positions for this section
  const sectionCursors = cursorPositions.filter(cursor => cursor.section === sectionId);
  
  // Calculate cursor positions
  useEffect(() => {
    if (!container) return;
    
    // Clean up any cursors that aren't in the current section anymore
    cursorsRef.current.forEach((cursorEl, userId) => {
      if (!sectionCursors.some(cursor => cursor.userId === userId)) {
        cursorEl.remove();
        cursorsRef.current.delete(userId);
      }
    });
    
    // Update or create cursors for current users
    sectionCursors.forEach(cursor => {
      try {
        // Get or create cursor element
        let cursorEl = cursorsRef.current.get(cursor.userId);
        if (!cursorEl) {
          cursorEl = document.createElement('div');
          cursorEl.className = 'absolute pointer-events-none';
          cursorEl.style.zIndex = '100';
          cursorEl.dataset.userId = cursor.userId.toString();
          
          // Add cursor line
          const cursorLine = document.createElement('div');
          cursorLine.className = 'absolute h-[18px] w-[2px] bg-blue-500 animate-pulse';
          cursorEl.appendChild(cursorLine);
          
          // Add cursor label
          const cursorLabel = document.createElement('div');
          cursorLabel.className = 'absolute top-[-20px] left-[-2px] text-xs px-1 py-0.5 bg-blue-500 text-white rounded whitespace-nowrap';
          cursorLabel.textContent = cursor.username;
          cursorEl.appendChild(cursorLabel);
          
          container.appendChild(cursorEl);
          cursorsRef.current.set(cursor.userId, cursorEl);
        }
        
        // Calculate cursor position
        // This is simplified and would need to be adapted based on your actual input component
        const containerRect = container.getBoundingClientRect();
        const textPosition = Math.min(cursor.position, container.textContent?.length || 0);
        
        // In a real implementation, you would need to calculate the actual position
        // This is just a simplified example
        const offsetX = (textPosition * 8) % (containerRect.width - 50); // Rough approximation
        const offsetY = Math.floor((textPosition * 8) / (containerRect.width - 50)) * 20;
        
        cursorEl.style.left = `${offsetX}px`;
        cursorEl.style.top = `${offsetY}px`;
      } catch (error) {
        console.error('Error updating cursor position:', error);
      }
    });
    
    // Cleanup function
    return () => {
      cursorsRef.current.forEach(cursorEl => {
        cursorEl.remove();
      });
      cursorsRef.current.clear();
    };
  }, [container, sectionCursors, sectionId]);
  
  // No actual render, the cursors are added directly to the DOM
  return null;
}

export function CollaborativeCursorWrapper({ resumeId, sectionId, children }: { resumeId: number, sectionId: string, children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className="relative">
      {children}
      <RemoteCursors 
        resumeId={resumeId} 
        sectionId={sectionId} 
        container={containerRef.current} 
      />
    </div>
  );
}