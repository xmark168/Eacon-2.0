import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const TRACKING_DIR = path.join(process.cwd(), 'analytics');
const EVENTS_FILE = path.join(TRACKING_DIR, 'events.json');
const SESSIONS_FILE = path.join(TRACKING_DIR, 'sessions.json');

interface AnalyticsStats {
  overview: {
    totalEvents: number;
    totalSessions: number;
    totalPageViews: number;
    totalClicks: number;
    uniqueVisitors: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  byEventType: Record<string, number>;
  byPage: Record<string, number>;
  byHour: Record<string, number>;
  byDay: Record<string, number>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topPages: Array<{ page: string; views: number; clicks: number }>;
  deviceStats: {
    mobile: number;
    desktop: number;
    tablet: number;
    bot: number;
  };
  browserStats: Record<string, number>;
  recentEvents: any[];
  activeSessions: number;
}

async function readAnalyticsData() {
  let events = [];
  let sessions = [];

  try {
    // Kiểm tra xem thư mục có tồn tại không
    try {
      await fs.access(TRACKING_DIR);
    } catch {
      // Tạo thư mục nếu chưa có
      await fs.mkdir(TRACKING_DIR, { recursive: true });
    }

    const eventsData = await fs.readFile(EVENTS_FILE, 'utf-8');
    events = JSON.parse(eventsData);
    if (!Array.isArray(events)) {
      events = [];
    }
  } catch (error) {
    console.log('No events file found or error reading, using empty array');
    events = [];
  }

  try {
    const sessionsData = await fs.readFile(SESSIONS_FILE, 'utf-8');
    sessions = JSON.parse(sessionsData);
    if (!Array.isArray(sessions)) {
      sessions = [];
    }
  } catch (error) {
    console.log('No sessions file found or error reading, using empty array');
    sessions = [];
  }

  return { events, sessions };
}

function detectDevice(userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'bot' {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  
  if (/bot|crawler|spider|crawling/.test(ua)) return 'bot';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  
  return 'desktop';
}

function getBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  
  return 'Other';
}

function generateStats(events: any[], sessions: any[]): AnalyticsStats {
  const now = Date.now();
  
  // Filter events từ 30 ngày gần nhất
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter(event => {
    try {
      const eventTime = new Date(event.timestamp || event.serverTimestamp).getTime();
      return eventTime > thirtyDaysAgo;
    } catch {
      return false;
    }
  });
  
  const recentSessions = sessions.filter(session => {
    try {
      const sessionTime = new Date(session.startTime).getTime();
      return sessionTime > thirtyDaysAgo;
    } catch {
      return false;
    }
  });

  // Thống kê cơ bản
  const totalEvents = recentEvents.length;
  const totalSessions = recentSessions.length;
  const pageViews = recentEvents.filter(e => e.eventType === 'page_view');
  const clicks = recentEvents.filter(e => e.eventType === 'click');
  
  const uniqueVisitors = new Set(recentEvents.map(e => e.sessionId)).size;
  
  // Thời gian session trung bình
  const completedSessions = recentSessions.filter(s => s.duration && s.duration > 0);
  const averageSessionDuration = completedSessions.length > 0 
    ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length / 1000
    : 0;

  // Bounce rate (sessions có 1 page view)
  const singlePageSessions = recentSessions.filter(s => s.pageViews <= 1).length;
  const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0;

  // Thống kê theo loại event
  const byEventType = recentEvents.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Thống kê theo trang
  const byPage = pageViews.reduce((acc, event) => {
    acc[event.page] = (acc[event.page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Thống kê theo giờ
  const byHour = recentEvents.reduce((acc, event) => {
    try {
      const hour = new Date(event.timestamp || event.serverTimestamp).getHours();
      acc[hour.toString()] = (acc[hour.toString()] || 0) + 1;
    } catch {
      // Skip invalid dates
    }
    return acc;
  }, {} as Record<string, number>);

  // Thống kê theo ngày
  const byDay = recentEvents.reduce((acc, event) => {
    try {
      const date = new Date(event.timestamp || event.serverTimestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
    } catch {
      // Skip invalid dates
    }
    return acc;
  }, {} as Record<string, number>);

  // Top referrers
  const referrerCounts = recentSessions.reduce((acc, session) => {
    const referrer = session.referrer || 'Direct';
    acc[referrer] = (acc[referrer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top pages
  const pageStats = Object.entries(byPage).map(([page, views]) => {
    const pageClicks = clicks.filter(c => c.page === page).length;
    return { page, views, clicks: pageClicks };
  }).sort((a, b) => b.views - a.views).slice(0, 10);

  // Device stats
  const deviceStats = recentEvents.reduce((acc, event) => {
    const device = detectDevice(event.userAgent);
    acc[device]++;
    return acc;
  }, { mobile: 0, desktop: 0, tablet: 0, bot: 0 });

  // Browser stats
  const browserStats = recentEvents.reduce((acc, event) => {
    const browser = getBrowser(event.userAgent);
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Active sessions (trong 30 phút qua)
  const thirtyMinutesAgo = now - (30 * 60 * 1000);
  const activeSessions = sessions.filter(session => {
    try {
      const lastActivity = session.endTime ? new Date(session.endTime).getTime() : new Date(session.startTime).getTime();
      return lastActivity > thirtyMinutesAgo;
    } catch {
      return false;
    }
  }).length;

  return {
    overview: {
      totalEvents,
      totalSessions,
      totalPageViews: pageViews.length,
      totalClicks: clicks.length,
      uniqueVisitors,
      averageSessionDuration: Math.round(averageSessionDuration),
      bounceRate: Math.round(bounceRate)
    },
    byEventType,
    byPage,
    byHour,
    byDay,
    topReferrers,
    topPages: pageStats,
    deviceStats,
    browserStats,
    recentEvents: recentEvents.slice(-100), // 100 events gần nhất
    activeSessions
  };
}

function generateMockAnalytics(): AnalyticsStats {
  // Tạo dữ liệu analytics giả khi không có file
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  // Mock recent events
  const mockEvents = [];
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(oneDayAgo + Math.random() * (24 * 60 * 60 * 1000));
    mockEvents.push({
      eventType: ['page_view', 'click', 'form_submit'][Math.floor(Math.random() * 3)],
      sessionId: `session_${Math.floor(Math.random() * 50)}`,
      page: ['/', '/dashboard', '/templates', '/generate', '/settings'][Math.floor(Math.random() * 5)],
      timestamp: timestamp.toISOString(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  const pageViews = mockEvents.filter(e => e.eventType === 'page_view');
  const clicks = mockEvents.filter(e => e.eventType === 'click');
  
  return {
    overview: {
      totalEvents: 2847,
      totalSessions: 342,
      totalPageViews: 1923,
      totalClicks: 824,
      uniqueVisitors: 289,
      averageSessionDuration: 247, // seconds
      bounceRate: 23 // percentage
    },
    byEventType: {
      'page_view': 1923,
      'click': 824,
      'form_submit': 100
    },
    byPage: {
      '/': 567,
      '/dashboard': 423,
      '/templates': 389,
      '/generate': 312,
      '/settings': 232
    },
    byHour: Array.from({length: 24}, (_, i) => ({[i.toString()]: Math.floor(Math.random() * 100 + 20)})).reduce((acc, curr) => ({...acc, ...curr}), {}),
    byDay: Array.from({length: 7}, (_, i) => {
      const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {[date]: Math.floor(Math.random() * 300 + 100)};
    }).reduce((acc, curr) => ({...acc, ...curr}), {}),
    topReferrers: [
      { referrer: 'Direct', count: 156 },
      { referrer: 'google.com', count: 89 },
      { referrer: 'facebook.com', count: 45 },
      { referrer: 'tiktok.com', count: 34 },
      { referrer: 'youtube.com', count: 18 }
    ],
    topPages: [
      { page: '/', views: 567, clicks: 234 },
      { page: '/dashboard', views: 423, clicks: 189 },
      { page: '/templates', views: 389, clicks: 156 },
      { page: '/generate', views: 312, clicks: 134 },
      { page: '/settings', views: 232, clicks: 89 }
    ],
    deviceStats: {
      mobile: 189,
      desktop: 134,
      tablet: 19,
      bot: 0
    },
    browserStats: {
      'Chrome': 234,
      'Safari': 67,
      'Firefox': 23,
      'Edge': 18
    },
    recentEvents: mockEvents.slice(-20),
    activeSessions: 12
  };
}

export async function GET(request: NextRequest) {
  try {
    const { events, sessions } = await readAnalyticsData();
    
    // Nếu không có dữ liệu thật, dùng mock data
    if (events.length === 0 && sessions.length === 0) {
      console.log('📊 No analytics files found, using mock data');
      const mockStats = generateMockAnalytics();
      return NextResponse.json({
        success: true,
        data: mockStats,
        source: 'mock'
      });
    }
    
    // Có dữ liệu thật, xử lý như bình thường
    const stats = generateStats(events, sessions);
    console.log('📊 Analytics loaded from files:', events.length, 'events,', sessions.length, 'sessions');

    return NextResponse.json({
      success: true,
      data: stats,
      source: 'file'
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    
    // Fallback to mock data khi có lỗi
    const mockStats = generateMockAnalytics();
    return NextResponse.json({
      success: true,
      data: mockStats,
      source: 'fallback'
    });
  }
} 