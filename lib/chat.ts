import db from './db';
import { formatDateTimeSerbia } from './timezone';

export interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string;
}

// Clean up messages older than 24 hours
export function cleanupOldMessages(): void {
  try {
    // Delete messages older than 24 hours (using Serbia timezone)
    // Calculate 24 hours ago in Serbia timezone
    const now = formatDateTimeSerbia();
    const nowDate = new Date();
    const yesterday24h = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
    const cutoffTime = formatDateTimeSerbia(yesterday24h);
    
    const result = db
      .prepare(
        `DELETE FROM chat_messages 
         WHERE created_at < ?`
      )
      .run(cutoffTime);
    
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} old chat messages`);
    }
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
  }
}

export interface ChatMessageWithProfile extends ChatMessage {
  profile_picture: string | null;
}

// Get recent messages (last 24 hours, limit 100)
export function getRecentMessages(limit: number = 100): ChatMessageWithProfile[] {
  // Clean up old messages first
  cleanupOldMessages();
  
  try {
    // Calculate 24 hours ago in Serbia timezone
    const nowDate = new Date();
    const yesterday24h = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
    const cutoffTime = formatDateTimeSerbia(yesterday24h);
    
    const messages = db
      .prepare(
        `SELECT 
          cm.id,
          cm.user_id,
          cm.username,
          cm.message,
          cm.created_at,
          u.profile_picture
         FROM chat_messages cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.created_at >= ?
         ORDER BY cm.created_at ASC
         LIMIT ?`
      )
      .all(cutoffTime, limit) as ChatMessageWithProfile[];
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Add a new message
export function addMessage(userId: number, username: string, message: string, clientTime?: string): ChatMessageWithProfile | null {
  try {
    // Clean up old messages before adding new one
    cleanupOldMessages();
    
    // Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return null;
    }
    if (trimmedMessage.length > 500) {
      throw new Error('Message too long (max 500 characters)');
    }
    
    // Use client time if provided (to match user's timezone), otherwise use server time
    let timeString: string;
    if (clientTime) {
      // Client sends time in format "YYYY-MM-DD HH:MM:SS" in their local timezone
      timeString = clientTime;
    } else {
      // Fallback to server time in Serbia timezone
      timeString = formatDateTimeSerbia();
    }
    
    const result = db
      .prepare(
        `INSERT INTO chat_messages (user_id, username, message, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(userId, username, trimmedMessage, timeString);
    
    // Return the newly created message with profile picture
    const newMessage = db
      .prepare(
        `SELECT 
          cm.id,
          cm.user_id,
          cm.username,
          cm.message,
          cm.created_at,
          u.profile_picture
         FROM chat_messages cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.id = ?`
      )
      .get(result.lastInsertRowid) as ChatMessageWithProfile;
    
    return newMessage;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

