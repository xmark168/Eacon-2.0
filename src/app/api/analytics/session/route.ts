import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

    // Đọc sessions hiện tại
    let sessions = [];
    try {
      const existingData = await fs.readFile(SESSIONS_FILE, 'utf-8');
      sessions = JSON.parse(existingData);
    } catch {
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

    // Lưu lại file
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 