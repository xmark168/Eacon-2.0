const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Đảm bảo thư mục analytics tồn tại
const analyticsDir = path.join(process.cwd(), 'analytics');
if (!fs.existsSync(analyticsDir)) {
  fs.mkdirSync(analyticsDir, { recursive: true });
}

// Configuration
const NUM_USERS = 50;
const DAYS_BACK = 30;
const SESSIONS_PER_USER_PER_DAY = { min: 1, max: 4 }; // Người dùng tích cực
const PAGES_PER_SESSION = { min: 3, max: 12 }; // Nhiều trang mỗi session
const CLICKS_PER_PAGE = { min: 1, max: 5 }; // Tích cực click

// Sample data
const pages = [
  '/',
  '/templates',
  '/generate',
  '/dashboard',
  '/payment',
  '/settings',
  '/images',
  '/scheduler',
  '/login',
  '/signup',
  '/contact',
  '/pricing',
  '/about'
];

const referrers = [
  'https://google.com',
  'https://facebook.com',
  'https://instagram.com',
  'https://twitter.com',
  'https://youtube.com',
  'https://tiktok.com',
  'Direct',
  'https://linkedin.com',
  'https://pinterest.com',
  'https://reddit.com'
];

const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
const devices = ['desktop', 'mobile', 'tablet'];
const countries = ['Vietnam', 'USA', 'Japan', 'Korea', 'Thailand', 'Singapore'];
const cities = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong'];

const eventElements = [
  'button-signup',
  'button-login',
  'button-generate',
  'link-templates',
  'button-payment',
  'nav-dashboard',
  'image-template-preview',
  'button-download',
  'link-pricing',
  'button-save-image',
  'nav-settings',
  'button-share',
  'link-contact',
  'button-buy-tokens'
];

// Helper functions
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBool = (probability = 0.5) => Math.random() < probability;

const generateUserAgent = (device, browser) => {
  const userAgents = {
    desktop: {
      Chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      Firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
      Safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      Edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
    },
    mobile: {
      Chrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.109 Mobile/15E148 Safari/604.1',
      Safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
    },
    tablet: {
      Safari: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      Chrome: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.109 Mobile/15E148 Safari/604.1'
    }
  };
  
  return userAgents[device]?.[browser] || userAgents.desktop.Chrome;
};

// Generate user profiles
const generateUsers = () => {
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const device = randomChoice(devices);
    const browser = randomChoice(browsers);
    const isRegistered = randomBool(0.6); // 60% đã đăng ký
    
    users.push({
      userId: isRegistered ? `user_${i + 1}` : null,
      preferredDevice: device,
      preferredBrowser: browser,
      userAgent: generateUserAgent(device, browser),
      country: randomChoice(countries),
      city: randomChoice(cities),
      sessionIds: [], // Sẽ được fill sau
      activityLevel: randomChoice(['high', 'medium', 'very_high']) // Tất cả đều tích cực
    });
  }
  return users;
};

// Generate sessions and events
const generateData = () => {
  const users = generateUsers();
  const events = [];
  const sessions = [];
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (let day = 0; day < DAYS_BACK; day++) {
    const dayStart = now - (day * oneDay);
    
    // Mỗi ngày, mỗi user có thể có nhiều sessions
    users.forEach((user, userIndex) => {
      const numSessions = randomBetween(SESSIONS_PER_USER_PER_DAY.min, SESSIONS_PER_USER_PER_DAY.max);
      
      for (let sessionIndex = 0; sessionIndex < numSessions; sessionIndex++) {
        const sessionId = uuidv4();
        user.sessionIds.push(sessionId);
        
        // Random time trong ngày
        const sessionStart = dayStart - randomBetween(0, oneDay - 1);
        
        // Session duration: 2-30 phút (người dùng tích cực)
        const sessionDuration = randomBetween(2 * 60 * 1000, 30 * 60 * 1000);
        const sessionEnd = sessionStart + sessionDuration;
        
        const numPages = randomBetween(PAGES_PER_SESSION.min, PAGES_PER_SESSION.max);
        let currentTime = sessionStart;
        let sessionPageViews = 0;
        let sessionEvents = [];
        
        // Referrer (chỉ cho session đầu tiên của ngày)
        const referrer = sessionIndex === 0 ? randomChoice(referrers) : '';
        
        // UTM parameters (30% chance)
        const hasUTM = randomBool(0.3);
        const utmSource = hasUTM ? randomChoice(['google', 'facebook', 'instagram', 'email']) : undefined;
        const utmMedium = hasUTM ? randomChoice(['cpc', 'social', 'email', 'organic']) : undefined;
        const utmCampaign = hasUTM ? randomChoice(['summer2024', 'ai_launch', 'black_friday']) : undefined;
        
        // Generate page views và clicks cho session này
        for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
          const page = randomChoice(pages);
          const pageViewTime = currentTime + randomBetween(1000, 30000); // 1-30 giây sau
          
          // Page view event
          const pageViewEvent = {
            sessionId,
            userId: user.userId,
            eventType: 'page_view',
            page,
            value: `Page ${pageIndex + 1}`,
            timestamp: pageViewTime,
            userAgent: user.userAgent,
            referrer: pageIndex === 0 ? referrer : '',
            ip: `192.168.1.${randomBetween(1, 254)}`,
            country: user.country,
            city: user.city,
            serverTimestamp: new Date(pageViewTime).toISOString()
          };
          
          events.push(pageViewEvent);
          sessionEvents.push(pageViewEvent);
          sessionPageViews++;
          
          // Generate clicks cho trang này
          const numClicks = randomBetween(CLICKS_PER_PAGE.min, CLICKS_PER_PAGE.max);
          for (let clickIndex = 0; clickIndex < numClicks; clickIndex++) {
            const clickTime = pageViewTime + randomBetween(2000, 60000); // 2-60 giây sau page view
            
            const clickEvent = {
              sessionId,
              userId: user.userId,
              eventType: 'click',
              page,
              element: randomChoice(eventElements),
              timestamp: clickTime,
              userAgent: user.userAgent,
              referrer: '',
              ip: `192.168.1.${randomBetween(1, 254)}`,
              country: user.country,
              city: user.city,
              serverTimestamp: new Date(clickTime).toISOString()
            };
            
            events.push(clickEvent);
            sessionEvents.push(clickEvent);
          }
          
          // Random form submits (10% chance)
          if (randomBool(0.1)) {
            const formEvent = {
              sessionId,
              userId: user.userId,
              eventType: 'form_submit',
              page,
              element: randomChoice(['contact-form', 'signup-form', 'login-form']),
              timestamp: pageViewTime + randomBetween(30000, 120000),
              userAgent: user.userAgent,
              referrer: '',
              ip: `192.168.1.${randomBetween(1, 254)}`,
              country: user.country,
              city: user.city,
              serverTimestamp: new Date(pageViewTime + randomBetween(30000, 120000)).toISOString()
            };
            
            events.push(formEvent);
            sessionEvents.push(formEvent);
          }
          
          currentTime = pageViewTime + randomBetween(10000, 90000); // 10-90 giây mỗi trang
        }
        
        // Tạo session record
        const sessionData = {
          sessionId,
          userId: user.userId,
          startTime: sessionStart,
          endTime: sessionEnd,
          duration: sessionDuration,
          pageViews: sessionPageViews,
          events: sessionEvents.length,
          isBot: false,
          firstPage: sessionEvents.find(e => e.eventType === 'page_view')?.page || '/',
          lastPage: sessionEvents.filter(e => e.eventType === 'page_view').pop()?.page || '/',
          referrer,
          campaign: utmCampaign,
          source: utmSource,
          medium: utmMedium,
          createdAt: new Date(sessionStart).toISOString(),
          updatedAt: new Date(sessionEnd).toISOString(),
          serverTimestamp: new Date(sessionEnd).toISOString()
        };
        
        sessions.push(sessionData);
      }
    });
  }
  
  return { events, sessions, users };
};

// Main execution
console.log('🎯 Generating analytics data...');
console.log(`📊 Users: ${NUM_USERS}`);
console.log(`📅 Days: ${DAYS_BACK}`);
console.log(`⚡ Activity level: High`);

const { events, sessions, users } = generateData();

console.log(`\n📈 Generated:`);
console.log(`- ${events.length.toLocaleString()} events`);
console.log(`- ${sessions.length.toLocaleString()} sessions`);
console.log(`- ${users.length} users`);

// Calculate stats
const pageViews = events.filter(e => e.eventType === 'page_view').length;
const clicks = events.filter(e => e.eventType === 'click').length;
const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
const avgSessionDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 1000 / 60;

console.log(`\n📊 Stats:`);
console.log(`- Page views: ${pageViews.toLocaleString()}`);
console.log(`- Clicks: ${clicks.toLocaleString()}`);
console.log(`- Unique registered users: ${uniqueUsers}`);
console.log(`- Avg session duration: ${avgSessionDuration.toFixed(1)} minutes`);

// Write to files
const eventsFile = path.join(analyticsDir, 'events.json');
const sessionsFile = path.join(analyticsDir, 'sessions.json');

fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

console.log(`\n✅ Data written to:`);
console.log(`- ${eventsFile}`);
console.log(`- ${sessionsFile}`);

console.log(`\n🎉 Done! You can now view analytics at /admin/analytics`); 