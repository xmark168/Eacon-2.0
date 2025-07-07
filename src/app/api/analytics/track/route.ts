import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Lưu tracking data vào file JSON thay vì database
const TRACKING_DIR = path.join(process.cwd(), 'analytics');
const EVENTS_FILE = path.join(TRACKING_DIR, 'events.json');

async function ensureAnalyticsDir() {
  try {
    await fs.access(TRACKING_DIR);
  } catch {
    await fs.mkdir(TRACKING_DIR, { recursive: true });
  }
}

async function getClientIP(request: NextRequest): Promise<string> {
  // Lấy IP từ headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}

async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string }> {
  // Đơn giản hóa - chỉ return empty object
  // Trong production có thể dùng service như ipinfo.io hoặc geoip
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const { event } = await request.json();
    
    if (!event) {
      return NextResponse.json({ error: 'Event data is required' }, { status: 400 });
    }

    await ensureAnalyticsDir();

    // Lấy thông tin IP và location
    const ip = await getClientIP(request);
    const location = await getLocationFromIP(ip);

    // Thêm thông tin IP và location vào event
    const enrichedEvent = {
      ...event,
      ip: ip !== 'unknown' ? ip : undefined,
      country: location.country,
      city: location.city,
      serverTimestamp: new Date().toISOString()
    };

    // Đọc events hiện tại
    let events = [];
    try {
      const existingData = await fs.readFile(EVENTS_FILE, 'utf-8');
      events = JSON.parse(existingData);
    } catch {
      // File chưa tồn tại hoặc rỗng
      events = [];
    }

    // Thêm event mới
    events.push(enrichedEvent);

    // Giữ chỉ 10000 events gần nhất để tránh file quá lớn
    if (events.length > 10000) {
      events = events.slice(-10000);
    }

    // Lưu lại file
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 