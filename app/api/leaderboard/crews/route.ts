import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    // Get crews ranked by total trophies of all members
    const crewsLeaderboard = db
      .prepare(`
        SELECT 
          c.id,
          c.name,
          c.tag,
          COALESCE(c.tag_color, '#0ea5e9') as tag_color,
          u_leader.username as leader_username,
          COUNT(DISTINCT cm.user_id) as member_count,
          COALESCE(SUM(u.trophies), 0) as total_trophies,
          COALESCE(AVG(u.trophies), 0) as avg_trophies,
          COALESCE(AVG(s.current_streak), 0) as avg_streak
        FROM crews c
        JOIN users u_leader ON c.leader_id = u_leader.id
        LEFT JOIN crew_members cm ON c.id = cm.crew_id
        LEFT JOIN users u ON cm.user_id = u.id
        LEFT JOIN streaks s ON u.id = s.user_id
        GROUP BY c.id
        ORDER BY total_trophies DESC, c.id ASC
        LIMIT ? OFFSET ?
      `)
      .all(limit, offset) as Array<{
        id: number;
        name: string;
        tag: string | null;
        tag_color: string;
        leader_username: string;
        member_count: number;
        total_trophies: number;
        avg_trophies: number;
        avg_streak: number;
      }>;

    // Get total count of crews
    const totalCount = db
      .prepare(`SELECT COUNT(*) as count FROM crews`)
      .get() as { count: number };

    return NextResponse.json({
      leaderboard: crewsLeaderboard.map((crew, index) => ({
        rank: offset + index + 1,
        id: crew.id,
        name: crew.name,
        tag: crew.tag,
        tag_color: crew.tag_color,
        leader_username: crew.leader_username,
        member_count: crew.member_count,
        total_trophies: Math.round(crew.total_trophies),
        avg_trophies: Math.round(crew.avg_trophies),
        avg_streak: Math.round(crew.avg_streak * 10) / 10,
      })),
      total: totalCount.count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Crews leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crews leaderboard' },
      { status: 500 }
    );
  }
}
