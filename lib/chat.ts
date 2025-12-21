import db from './db';

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
    // Delete messages older than 24 hours
    const result = db
      .prepare(
        `DELETE FROM chat_messages 
         WHERE created_at < datetime('now', '-24 hours')`
      )
      .run();
    
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
         WHERE cm.created_at >= datetime('now', '-24 hours')
         ORDER BY cm.created_at ASC
         LIMIT ?`
      )
      .all(limit) as ChatMessageWithProfile[];
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Add a new message
export function addMessage(userId: number, username: string, message: string): ChatMessageWithProfile | null {
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
    
    const result = db
      .prepare(
        `INSERT INTO chat_messages (user_id, username, message, created_at)
         VALUES (?, ?, ?, datetime('now'))`
      )
      .run(userId, username, trimmedMessage);
    
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

