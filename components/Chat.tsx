'use client';

import { useEffect, useState, useRef } from 'react';
import { getImageUrl } from '@/lib/image-utils';

interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string;
}

interface ChatProps {
  currentUserId: number;
  currentUsername: string;
  currentUserProfilePicture?: string | null;
}

export function Chat({ currentUserId, currentUsername, currentUserProfilePicture }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setError('');
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    setLoading(true);
    fetchMessages();

    // Refresh messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg flex flex-col h-[500px] sm:h-[600px]">
      {/* Chat Header */}
      <div className="border-b border-gray-700 p-3 sm:p-4 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-100">Global Chat</h3>
          <span className="text-xs text-gray-400">(clears every 24h)</span>
        </div>
        {error && (
          <div className="text-xs text-red-400 truncate max-w-[150px] sm:max-w-none">{error}</div>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-400"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                    <span className="text-gray-400 text-xs sm:text-sm font-semibold">
                      {msg.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Message Content */}
                <div className={`flex-1 min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-300">
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                  </div>
                  <div
                    className={`rounded-lg px-3 sm:px-4 py-2 max-w-[85%] sm:max-w-[75%] break-words ${
                      isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t border-gray-700 p-3 sm:p-4 bg-gray-800/50">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            disabled={sending}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium touch-manipulation min-h-[44px] whitespace-nowrap"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          {newMessage.length}/500 characters
        </p>
      </form>
    </div>
  );
}

