import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('picture') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB for profile pictures)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Get existing profile picture to delete it later
    const user = db.prepare('SELECT profile_picture FROM users WHERE id = ?').get(userId) as { profile_picture: string | null } | undefined;
    const oldPicturePath = user?.profile_picture;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create profile pictures directory if it doesn't exist
    const profilesDir = join(process.cwd(), 'public', 'profiles', userId.toString());
    if (!existsSync(profilesDir)) {
      await mkdir(profilesDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `profile.${extension}`;
    const filepath = join(profilesDir, filename);
    const relativePath = `/profiles/${userId}/${filename}`;

    await writeFile(filepath, buffer);

    // Delete old profile picture if it exists
    if (oldPicturePath && oldPicturePath.startsWith('/profiles/')) {
      try {
        const oldFilePath = join(process.cwd(), 'public', oldPicturePath);
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      } catch (error) {
        // Ignore errors when deleting old picture
        console.log('Error deleting old profile picture:', error);
      }
    }

    // Update database
    db.prepare('UPDATE users SET profile_picture = ? WHERE id = ?').run(relativePath, userId);

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      profile_picture: relativePath,
    });
  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get existing profile picture
    const user = db.prepare('SELECT profile_picture FROM users WHERE id = ?').get(userId) as { profile_picture: string | null } | undefined;
    const picturePath = user?.profile_picture;

    // Delete file if it exists
    if (picturePath && picturePath.startsWith('/profiles/')) {
      try {
        const filePath = join(process.cwd(), 'public', picturePath);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (error) {
        console.log('Error deleting profile picture:', error);
      }
    }

    // Update database
    db.prepare('UPDATE users SET profile_picture = NULL WHERE id = ?').run(userId);

    return NextResponse.json({ message: 'Profile picture removed successfully' });
  } catch (error: any) {
    console.error('Profile picture delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

