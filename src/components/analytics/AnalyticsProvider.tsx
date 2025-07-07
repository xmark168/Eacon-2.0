'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { getAnalytics, useAnalytics } from '@/lib/analytics';

interface AnalyticsContextType {
  trackPageView: (page: string, title?: string) => void;
  trackClick: (element: string, page: string, value?: string) => void;
  trackFormSubmit: (formName: string, page: string) => void;
  trackDownload: (fileName: string, page: string) => void;
  trackCustomEvent: (eventName: string, page: string, value?: string | number) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const analytics = useAnalytics();

  // Set user ID khi user login
  useEffect(() => {
    if (session?.user?.id && analytics?.setUserId) {
      analytics.setUserId(session.user.id);
    }
  }, [session?.user?.id, analytics]);

  // Track page view tự động khi route thay đổi
  useEffect(() => {
    if (analytics?.trackPageView && pathname) {
      const title = document.title;
      analytics.trackPageView(pathname, title);
    }
  }, [pathname, analytics]);

  // Setup automatic click tracking
  useEffect(() => {
    if (!analytics?.trackClick) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Track các elements quan trọng
      let elementInfo = '';
      
      // Buttons
      if (target.tagName === 'BUTTON' || target.type === 'button') {
        elementInfo = `button-${target.textContent?.trim() || target.className}`;
      }
      // Links
      else if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        elementInfo = `link-${href || target.textContent?.trim()}`;
      }
      // Có data-track attribute
      else if (target.hasAttribute('data-track')) {
        elementInfo = target.getAttribute('data-track') || '';
      }
      // Images
      else if (target.tagName === 'IMG') {
        elementInfo = `image-${target.getAttribute('alt') || target.src}`;
      }
      // Navigation items
      else if (target.closest('nav')) {
        elementInfo = `nav-${target.textContent?.trim()}`;
      }

      if (elementInfo) {
        analytics.trackClick(elementInfo, pathname);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [analytics, pathname]);

  const contextValue: AnalyticsContextType = {
    trackPageView: analytics?.trackPageView || (() => {}),
    trackClick: analytics?.trackClick || (() => {}),
    trackFormSubmit: analytics?.trackFormSubmit || (() => {}),
    trackDownload: analytics?.trackDownload || (() => {}),
    trackCustomEvent: analytics?.trackCustomEvent || (() => {})
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}

// HOC để wrap các component cần tracking đặc biệt
export function withAnalytics<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function AnalyticsWrappedComponent(props: T) {
    const analytics = useAnalyticsContext();
    const pathname = usePathname();

    useEffect(() => {
      analytics.trackCustomEvent(`component-mounted-${componentName}`, pathname);
    }, [analytics, pathname]);

    return <Component {...props} />;
  };
} 