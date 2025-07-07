import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const TRACKING_DIR = path.join(process.cwd(), 'analytics');
const SESSIONS_FILE = path.join(TRACKING_DIR, 'sessions.json');

async function ensureAnalyticsDir() {
  try {
    await fs.access(TRACKING_DIR);
  } catch {
    await fs.mkdir(TRACKING_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionData } = await request.json();
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Session data is required' }, { status: 400 });
    }

    await ensureAnalyticsDir();

    // Thêm timestamp server
    const enrichedSession = {
      ...sessionData,
      serverTimestamp: new Date().toISOString(),
      endTime: new Date().toISOString()
    };

    // Đọc sessions hiện tại với error handling tốt hơn
    let sessions = [];
    try {
      const existingData = await fs.readFile(SESSIONS_FILE, 'utf-8');
      sessions = JSON.parse(existingData);
      if (!Array.isArray(sessions)) {
        sessions = [];
      }
    } catch (error) {
      // File chưa tồn tại hoặc lỗi format, tạo mới
      console.log('Creating new sessions file or recovering from error:', error.message);
      sessions = [];
    }

    // Tìm session hiện có hoặc thêm mới
    const existingIndex = sessions.findIndex(s => s.sessionId === sessionData.sessionId);
    
    if (existingIndex >= 0) {
      // Cập nhật session hiện có
      sessions[existingIndex] = enrichedSession;
    } else {
      // Thêm session mới
      sessions.push(enrichedSession);
    }

    // Giữ chỉ 5000 sessions gần nhất
    if (sessions.length > 5000) {
      sessions = sessions.slice(-5000);
    }

    // Lưu lại file với error handling
    try {
      await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
      console.log('📊 Session tracked:', sessionData.sessionId?.substring(0, 8));
    } catch (writeError) {
      console.error('Failed to write sessions file:', writeError);
      // Không throw error để không crash app
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session tracking error:', error);
    // Luôn return success để không crash app khi analytics lỗi
    return NextResponse.json({ success: true });
  }
} 