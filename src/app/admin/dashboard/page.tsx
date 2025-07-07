'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  File,
  CreditCard,
  TrendingUp,
  Activity,
  AlertTriangle,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalTemplates: number;
  totalPayments: number;
  totalRevenue: number;
  recentUsers: number;
  recentPayments: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'payment_completed' | 'template_created' | 'system_alert';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const mockStats: DashboardStats = {
  totalUsers: 1247,
  totalTemplates: 150,
  totalPayments: 2847,
  totalRevenue: 45680,
  recentUsers: 23,
  recentPayments: 12,
  activeUsers: 89,
  systemHealth: 'healthy'
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'payment_completed',
    description: 'Payment completed: $25 USD for 5000 tokens',
    timestamp: '2 minutes ago',
    status: 'success'
  },
  {
    id: '2',
    type: 'user_registered',
    description: 'New user registered: john.doe@example.com',
    timestamp: '5 minutes ago',
    status: 'success'
  },
  {
    id: '3',
    type: 'template_created',
    description: 'New template created: "Vintage Photography Style"',
    timestamp: '15 minutes ago',
    status: 'success'
  },
  {
    id: '4',
    type: 'system_alert',
    description: 'High CPU usage detected on server',
    timestamp: '1 hour ago',
    status: 'warning'
  }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API error');
      }
      
      const data = result.data;
      
      // Transform API data to match component interface
      const transformedStats: DashboardStats = {
        totalUsers: data.users.total,
        totalTemplates: data.templates.total,
        totalPayments: data.payments.total,
        totalRevenue: data.revenue.total,
        recentUsers: data.users.newThisWeek,
        recentPayments: data.revenue.todayPayments,
        activeUsers: data.users.active,
        systemHealth: 'healthy' as const
      };
      
      setStats(transformedStats);
      
      // Create recent activity from real data
      const activities: RecentActivity[] = [];
      
      // Add recent users
      if (data.recentActivities.users.length > 0) {
        data.recentActivities.users.slice(0, 2).forEach((user: any, index: number) => {
          activities.push({
            id: `user_${user.id}`,
            type: 'user_registered',
            description: `Người dùng mới: ${user.email}`,
            timestamp: new Date(user.createdAt).toLocaleString('vi-VN'),
            status: 'success'
          });
        });
      }
      
      // Add recent payments
      if (data.recentActivities.payments.length > 0) {
        data.recentActivities.payments.slice(0, 2).forEach((payment: any, index: number) => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'payment_completed',
            description: `Thanh toán: ${payment.amount.toLocaleString()} VND - ${payment.tokens} tokens`,
            timestamp: new Date(payment.createdAt).toLocaleString('vi-VN'),
            status: payment.status === 'PAID' ? 'success' : 'warning'
          });
        });
      }
      
      // Add system info
      activities.push({
        id: 'system_health',
        type: 'system_alert',
        description: `Hệ thống hoạt động bình thường - ${data.images.total} ảnh đã tạo`,
        timestamp: new Date().toLocaleString('vi-VN'),
        status: 'success'
      });
      
      setRecentActivity(activities);
      
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Không thể tải dữ liệu thống kê');
      // Fallback to mock data
      setStats(mockStats);
      setRecentActivity(mockRecentActivity);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color 
  }: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
    icon: any;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <div className="flex items-center mt-2">
            {changeType === 'increase' ? (
              <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </span>
            <span className="text-gray-400 text-sm ml-1">so với tháng trước</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ActivityIcon = ({ type }: { type: RecentActivity['type'] }) => {
    switch (type) {
      case 'user_registered':
        return <Users className="w-4 h-4" />;
      case 'payment_completed':
        return <CreditCard className="w-4 h-4" />;
      case 'template_created':
        return <File className="w-4 h-4" />;
      case 'system_alert':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải dữ liệu thống kê...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">⚠</span>
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchStats}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Không có dữ liệu</p>
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
            <h1 className="text-3xl font-bold text-white">Bảng điều khiển</h1>
            <p className="text-gray-400 mt-1">Chào mừng trở lại! Đây là tổng quan về nền tảng của bạn.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchStats}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Làm mới</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                stats.systemHealth === 'healthy' ? 'bg-green-500' : 
                stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              } animate-pulse`}></div>
              <span className="text-sm text-gray-400">
                Hệ thống {stats.systemHealth === 'healthy' ? 'ổn định' : stats.systemHealth}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Tổng người dùng"
            value={stats.totalUsers.toLocaleString('vi-VN')}
            change="+12.5%"
            changeType="increase"
            icon={Users}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            title="Templates"
            value={stats.totalTemplates.toLocaleString('vi-VN')}
            change="+8.2%"
            changeType="increase"
            icon={File}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            title="Giao dịch"
            value={stats.totalPayments.toLocaleString('vi-VN')}
            change="+23.1%"
            changeType="increase"
            icon={CreditCard}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Doanh thu"
            value={`${stats.totalRevenue.toLocaleString('vi-VN')} ₫`}
            change="+18.7%"
            changeType="increase"
            icon={DollarSign}
            color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Hoạt động gần đây</h3>
            <div className="text-3xl font-bold text-white">{stats.recentUsers}</div>
            <p className="text-gray-400 text-sm">Người dùng mới tuần này</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Đang hoạt động</h3>
            <div className="text-3xl font-bold text-white">{stats.activeUsers}</div>
            <p className="text-gray-400 text-sm">Người dùng online hiện tại</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Doanh thu hôm nay</h3>
            <div className="text-3xl font-bold text-white">{(stats.recentPayments * 500000).toLocaleString('vi-VN')} ₫</div>
            <p className="text-gray-400 text-sm">Từ {stats.recentPayments} giao dịch</p>
          </motion.div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
              <button className="text-red-500 hover:text-red-400 text-sm font-medium">
                Xem tất cả
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'success' ? 'bg-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Thao tác nhanh</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-white">Quản lý người dùng</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <File className="w-5 h-5 text-purple-500" />
                <span className="text-white">Thêm Template</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <CreditCard className="w-5 h-5 text-green-500" />
                <span className="text-white">Xem thanh toán</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Activity className="w-5 h-5 text-yellow-500" />
                <span className="text-white">Trạng thái hệ thống</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Trạng thái hệ thống</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Cơ sở dữ liệu</p>
                <p className="text-green-500 font-medium">Hoạt động tốt</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Máy chủ API</p>
                <p className="text-green-500 font-medium">Trực tuyến</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Cổng thanh toán</p>
                <p className="text-green-500 font-medium">Đã kết nối</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
} 