import db from './db';
import { formatDateTimeSerbia } from './timezone';

export interface CrewChatMessage {
  id: number;
  crew_id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string;
  profile_picture?: string | null;
}

// Get recent crew chat messages
export function getCrewChatMessages(crewId: number, limit: number = 100): CrewChatMessage[] {
  try {
    const messages = db
      .prepare(
        `SELECT 
          ccm.id,
          ccm.crew_id,
          ccm.user_id,
          ccm.username,
          ccm.message,
          ccm.created_at,
          u.profile_picture
        FROM crew_chat_messages ccm
        JOIN users u ON ccm.user_id = u.id
        WHERE ccm.crew_id = ?
        ORDER BY ccm.created_at DESC
        LIMIT ?`
      )
      .all(crewId, limit) as CrewChatMessage[];

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error fetching crew chat messages:', error);
    return [];
  }
}

// Add a new crew chat message
export function addCrewChatMessage(
  crewId: number,
  userId: number,
  username: string,
  message: string,
  clientTime?: string
): CrewChatMessage | null {
  try {
    // Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return null;
    }
    if (trimmedMessage.length > 500) {
      throw new Error('Message too long (max 500 characters)');
    }

    // Use client time if provided, otherwise use server time
    let timeString: string;
    if (clientTime) {
      timeString = clientTime;
    } else {
      timeString = formatDateTimeSerbia();
    }

    const result = db
      .prepare(
        `INSERT INTO crew_chat_messages (crew_id, user_id, username, message, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(crewId, userId, username, trimmedMessage, timeString);

    // Return the newly created message with profile picture
    const newMessage = db
      .prepare(
        `SELECT 
          ccm.id,
          ccm.crew_id,
          ccm.user_id,
          ccm.username,
          ccm.message,
          ccm.created_at,
          u.profile_picture
         FROM crew_chat_messages ccm
         JOIN users u ON ccm.user_id = u.id
         WHERE ccm.id = ?`
      )
      .get(result.lastInsertRowid) as CrewChatMessage;

    return newMessage;
  } catch (error) {
    console.error('Error adding crew chat message:', error);
    throw error;
  }
}

