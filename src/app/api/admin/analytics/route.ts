import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
    const eventsData = await fs.readFile(EVENTS_FILE, 'utf-8');
    events = JSON.parse(eventsData);
  } catch {
    // File không tồn tại
  }

  try {
    const sessionsData = await fs.readFile(SESSIONS_FILE, 'utf-8');
    sessions = JSON.parse(sessionsData);
  } catch {
    // File không tồn tại
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
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  // Filter events từ 30 ngày gần nhất
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter(event => 
    new Date(event.timestamp || event.serverTimestamp).getTime() > thirtyDaysAgo
  );
  
  const recentSessions = sessions.filter(session =>
    new Date(session.startTime).getTime() > thirtyDaysAgo
  );

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
    const hour = new Date(event.timestamp || event.serverTimestamp).getHours();
    acc[hour.toString()] = (acc[hour.toString()] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Thống kê theo ngày
  const byDay = recentEvents.reduce((acc, event) => {
    const date = new Date(event.timestamp || event.serverTimestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
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
    const lastActivity = session.endTime ? new Date(session.endTime).getTime() : new Date(session.startTime).getTime();
    return lastActivity > thirtyMinutesAgo;
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

export async function GET(request: NextRequest) {
  try {
    const { events, sessions } = await readAnalyticsData();
    const stats = generateStats(events, sessions);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 