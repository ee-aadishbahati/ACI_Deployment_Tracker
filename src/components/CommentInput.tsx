import { useState } from 'react';
import { Mention, MentionsInput } from 'react-mentions';
import { useDatabaseApp } from '../contexts/DatabaseAppContext';
import { Send, X } from 'lucide-react';

interface CommentInputProps {
  taskId: string;
  fabricId: string;
  parentCommentId?: string;
  placeholder?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export function CommentInput({ 
  taskId, 
  fabricId, 
  parentCommentId, 
  placeholder = "Add a comment...",
  onSubmit,
  onCancel 
}: CommentInputProps) {
  const { state, addComment } = useDatabaseApp();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const users = Object.values(state.users).map(user => ({
    id: user.id,
    display: user.displayName
  }));

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]);
    }
    
    return mentions;
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const mentions = extractMentions(content);
      
      await addComment({
        taskId,
        fabricId,
        userId: state.currentUser,
        content: content.trim(),
        mentions,
        parentCommentId
      });
      
      setContent('');
      onSubmit?.();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const mentionStyle = {
    control: {
      backgroundColor: '#fff',
      fontSize: 14,
      fontWeight: 'normal',
    },
    '&multiLine': {
      control: {
        fontFamily: 'inherit',
        minHeight: 63,
      },
      highlighter: {
        padding: 9,
        border: '1px solid transparent',
      },
      input: {
        padding: 9,
        border: '1px solid #d1d5db',
        borderRadius: 6,
        outline: 0,
        resize: 'none' as const,
      },
    },
    suggestions: {
      list: {
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.15)',
        fontSize: 14,
        borderRadius: 6,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      item: {
        padding: '8px 12px',
        borderBottom: '1px solid rgba(0,0,0,0.15)',
        '&focused': {
          backgroundColor: '#3b82f6',
          color: 'white',
        },
      },
    },
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <MentionsInput
          value={content}
          onChange={(e: any) => setContent(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          style={mentionStyle}
          className="w-full"
          disabled={isSubmitting}
        >
          <Mention
            trigger="@"
            data={users}
            style={{
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              fontWeight: 'bold',
              padding: '2px 4px',
              borderRadius: '3px',
            }}
          />
        </MentionsInput>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Press Ctrl+Enter to submit
        </span>
        
        <div className="flex space-x-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
              disabled={isSubmitting}
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
