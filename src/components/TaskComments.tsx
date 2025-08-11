import { useState } from 'react';
import { TaskComment } from '../types';
import { useApp } from '../contexts/AppContext';
import { 
  MessageSquare, 
  Reply, 
  Edit3, 
  Trash2, 
  User as UserIcon,
  Clock
} from 'lucide-react';
import { CommentInput } from './CommentInput';

interface TaskCommentsProps {
  taskId: string;
  fabricId: string;
}

export function TaskComments({ taskId, fabricId }: TaskCommentsProps) {
  const { state, getTaskComments, deleteComment, updateComment } = useApp();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const comments = getTaskComments(taskId);

  const topLevelComments = comments.filter(comment => !comment.parentCommentId);
  const getReplies = (commentId: string) => 
    comments.filter(comment => comment.parentCommentId === commentId);

  const handleEdit = (comment: TaskComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      await updateComment({
        ...comment,
        content: editContent
      });
    }
    setEditingComment(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId, taskId);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderComment = (comment: TaskComment, isReply = false) => {
    const user = state.users[comment.userId];
    const replies = getReplies(comment.id);
    const isEditing = editingComment === comment.id;
    const canEdit = comment.userId === state.currentUser;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {user?.displayName || 'Unknown User'}
              </span>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(comment.timestamp)}</span>
                {comment.edited && <span>(edited)</span>}
              </div>
            </div>
            
            {canEdit && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEdit(comment)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Edit comment"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete comment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSaveEdit(comment.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {comment.content}
              </p>
              
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            </>
          )}
        </div>
        
        {replyingTo === comment.id && (
          <div className="ml-8 mb-3">
            <CommentInput
              taskId={taskId}
              fabricId={fabricId}
              parentCommentId={comment.id}
              placeholder={`Reply to ${user?.displayName || 'comment'}...`}
              onSubmit={() => setReplyingTo(null)}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}
        
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  if (comments.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
        <CommentInput taskId={taskId} fabricId={fabricId} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Comments ({comments.length})
        </span>
      </div>
      
      {topLevelComments.map(comment => renderComment(comment))}
      
      <CommentInput taskId={taskId} fabricId={fabricId} />
    </div>
  );
}
