import { v4 as uuidv4 } from 'uuid';

export interface TrackingEvent {
  sessionId: string;
  userId?: string;
  eventType: 'page_view' | 'click' | 'form_submit' | 'download' | 'custom';
  page: string;
  element?: string;
  value?: string | number;
  timestamp: number;
  userAgent: string;
  referrer: string;
  ip?: string;
  country?: string;
  city?: string;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  pageViews: number;
  events: TrackingEvent[];
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  isBot: boolean;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private sessionData: SessionData;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionData = this.getOrCreateSessionData();
    this.setupBeforeUnload();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getOrCreateSessionData(): SessionData {
    if (typeof window === 'undefined') {
      return {
        sessionId: '',
        startTime: Date.now(),
        pageViews: 0,
        events: [],
        referrer: '',
        isBot: false
      };
    }

    const stored = sessionStorage.getItem('analytics_session_data');
    if (stored) {
      return JSON.parse(stored);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sessionData: SessionData = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      pageViews: 0,
      events: [],
      referrer: document.referrer,
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      isBot: this.detectBot()
    };

    this.saveSessionData(sessionData);
    return sessionData;
  }

  private detectBot(): boolean {
    if (typeof window === 'undefined') return false;
    
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /crawling/i,
      /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
      /whatsapp/i, /telegram/i, /googlebot/i, /bingbot/i
    ];
    
    return botPatterns.some(pattern => pattern.test(navigator.userAgent));
  }

  private saveSessionData(data: SessionData) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('analytics_session_data', JSON.stringify(data));
  }

  private setupBeforeUnload() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('beforeunload', () => {
      this.sendSessionData();
    });

    // Gửi dữ liệu định kỳ mỗi 30 giây
    setInterval(() => {
      this.sendSessionData();
    }, 30000);
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.sessionData.events.forEach(event => {
      if (!event.userId) event.userId = userId;
    });
    this.saveSessionData(this.sessionData);
  }

  trackPageView(page: string, title?: string) {
    const event: TrackingEvent = {
      sessionId: this.sessionId,
      userId: this.userId,
      eventType: 'page_view',
      page,
      value: title,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof window !== 'undefined' ? document.referrer : ''
    };

    this.sessionData.pageViews++;
    this.sessionData.events.push(event);
    this.saveSessionData(this.sessionData);

    // Gửi ngay lập tức
    this.sendEvent(event);
  }

  trackClick(element: string, page: string, value?: string) {
    const event: TrackingEvent = {
      sessionId: this.sessionId,
      userId: this.userId,
      eventType: 'click',
      page,
      element,
      value,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof window !== 'undefined' ? document.referrer : ''
    };

    this.sessionData.events.push(event);
    this.saveSessionData(this.sessionData);
    this.sendEvent(event);
  }

  trackFormSubmit(formName: string, page: string) {
    const event: TrackingEvent = {
      sessionId: this.sessionId,
      userId: this.userId,
      eventType: 'form_submit',
      page,
      element: formName,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof window !== 'undefined' ? document.referrer : ''
    };

    this.sessionData.events.push(event);
    this.saveSessionData(this.sessionData);
    this.sendEvent(event);
  }

  trackDownload(fileName: string, page: string) {
    const event: TrackingEvent = {
      sessionId: this.sessionId,
      userId: this.userId,
      eventType: 'download',
      page,
      element: fileName,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof window !== 'undefined' ? document.referrer : ''
    };

    this.sessionData.events.push(event);
    this.saveSessionData(this.sessionData);
    this.sendEvent(event);
  }

  trackCustomEvent(eventName: string, page: string, value?: string | number) {
    const event: TrackingEvent = {
      sessionId: this.sessionId,
      userId: this.userId,
      eventType: 'custom',
      page,
      element: eventName,
      value,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof window !== 'undefined' ? document.referrer : ''
    };

    this.sessionData.events.push(event);
    this.saveSessionData(this.sessionData);
    this.sendEvent(event);
  }

  private async sendEvent(event: TrackingEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private async sendSessionData() {
    try {
      const sessionDuration = Date.now() - this.sessionData.startTime;
      
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionData: {
            ...this.sessionData,
            duration: sessionDuration
          }
        })
      });
    } catch (error) {
      console.error('Failed to send session data:', error);
    }
  }

  getSessionStats() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionData.startTime,
      pageViews: this.sessionData.pageViews,
      events: this.sessionData.events.length,
      isBot: this.sessionData.isBot
    };
  }
}

// Singleton instance
let analytics: Analytics | null = null;

export const getAnalytics = (): Analytics => {
  if (!analytics && typeof window !== 'undefined') {
    analytics = new Analytics();
  }
  return analytics as Analytics;
};

// Hook để tracking tự động
export const useAnalytics = () => {
  const analytics = getAnalytics();
  
  return {
    trackPageView: analytics?.trackPageView.bind(analytics),
    trackClick: analytics?.trackClick.bind(analytics),
    trackFormSubmit: analytics?.trackFormSubmit.bind(analytics),
    trackDownload: analytics?.trackDownload.bind(analytics),
    trackCustomEvent: analytics?.trackCustomEvent.bind(analytics),
    setUserId: analytics?.setUserId.bind(analytics),
    getStats: analytics?.getSessionStats.bind(analytics)
  };
}; 