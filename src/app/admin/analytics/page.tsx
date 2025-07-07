'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Users,
  MousePointer,
  Clock,
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  Globe,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AnalyticsData {
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

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
    // Refresh mỗi 30 giây
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'bot': return <Bot className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const getChangeIndicator = (value: number, trend: 'up' | 'down' = 'up') => {
    if (trend === 'up') {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    }
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  if (isLoading && !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Dang tai thong ke analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Chua co du lieu analytics</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics & Traffic</h1>
            <p className="text-gray-400 mt-1">Thong ke luot truy cap va hanh vi nguoi dung</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{data.activeSessions} nguoi dang online</span>
            </div>
            <button 
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              Làm moi
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Tong luot xem trang</p>
                <p className="text-3xl font-bold text-white">{data.overview.totalPageViews.toLocaleString('vi-VN')}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Nguoi dung duy nhat</p>
                <p className="text-3xl font-bold text-white">{data.overview.uniqueVisitors.toLocaleString('vi-VN')}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Tong luot click</p>
                <p className="text-3xl font-bold text-white">{data.overview.totalClicks.toLocaleString('vi-VN')}</p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Thoi gian trung binh</p>
                <p className="text-3xl font-bold text-white">{formatDuration(data.overview.averageSessionDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Tong phien</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">{data.overview.totalSessions.toLocaleString('vi-VN')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Bounce Rate</p>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-white">{data.overview.bounceRate}%</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Tong su kien</p>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white">{data.overview.totalEvents.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Thong ke thiet bi</h3>
            <div className="space-y-4">
              {Object.entries(data.deviceStats).map(([device, count]) => {
                const total = Object.values(data.deviceStats).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device)}
                      <span className="text-gray-300 capitalize">{device}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">{count}</span>
                      <span className="text-gray-400 text-sm">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Thong ke trinh duyet</h3>
            <div className="space-y-3">
              {Object.entries(data.browserStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([browser, count]) => {
                  const total = Object.values(data.browserStats).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={browser} className="flex items-center justify-between">
                      <span className="text-gray-300">{browser}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Top Pages & Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Trang pho bien nhat</h3>
            <div className="space-y-3">
              {data.topPages.slice(0, 8).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 truncate">{page.page}</p>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <div className="text-center">
                      <p className="text-white font-medium">{page.views}</p>
                      <p className="text-gray-500 text-xs">views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-400 font-medium">{page.clicks}</p>
                      <p className="text-gray-500 text-xs">clicks</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Nguon traffic chinh</h3>
            <div className="space-y-3">
              {data.topReferrers.slice(0, 8).map((ref, index) => (
                <div key={ref.referrer} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 truncate">
                      {ref.referrer === 'Direct' ? 'Truy cap truc tiep' : ref.referrer}
                    </p>
                  </div>
                  <span className="text-white font-medium ml-4">{ref.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Hoat dong gan day</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300 text-sm">Thoi gian</th>
                  <th className="px-4 py-2 text-left text-gray-300 text-sm">Loai</th>
                  <th className="px-4 py-2 text-left text-gray-300 text-sm">Trang</th>
                  <th className="px-4 py-2 text-left text-gray-300 text-sm">Element</th>
                  <th className="px-4 py-2 text-left text-gray-300 text-sm">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.recentEvents.slice(0, 20).map((event, index) => (
                  <tr key={index} className="hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-2 text-gray-400 text-sm">
                      {new Date(event.timestamp || event.serverTimestamp).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.eventType === 'page_view' ? 'bg-blue-100 text-blue-800' :
                        event.eventType === 'click' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-300 text-sm">{event.page}</td>
                    <td className="px-4 py-2 text-gray-400 text-sm">{event.element || '-'}</td>
                    <td className="px-4 py-2 text-gray-400 text-sm">
                      {event.userId ? 'User' : 'Anonymous'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 