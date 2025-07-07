'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, AlertTriangle, CheckCircle, Server, Database, Key, Mail, Shield, RefreshCw, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  maintenance: boolean;
  registrationEnabled: boolean;
  maxFileSize: number;
  tokenPricing: {
    tokens5000: number;
    tokens10000: number;
    tokens20000: number;
  };
  openaiApiKey?: string;
  emailSettings?: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
  };
}

const defaultConfig: SystemConfig = {
  siteName: 'Eacon AI Platform',
  siteDescription: 'Nền tảng tạo ảnh AI thông minh',
  maintenance: false,
  registrationEnabled: true,
  maxFileSize: 8,
  tokenPricing: {
    tokens5000: 500000,
    tokens10000: 950000,
    tokens20000: 1800000
  }
};

export default function AdminSystem() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'api' | 'maintenance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
    fetchSystemStats();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/config');
      
      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        throw new Error(data.error || 'API error');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      // Fallback to default config
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_system_stats' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSystemStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save config');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (error) {
      alert('Không thể lưu cấu hình: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Xóa toàn bộ cache hệ thống?')) return;
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert('Không thể xóa cache: ' + (error as Error).message);
    }
  };

  const cleanupOldData = async () => {
    if (!confirm('Xóa dữ liệu cũ (ảnh > 30 ngày, scheduled posts > 7 ngày)?')) return;
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_old_data' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { details } = data;
        alert(`${data.message}\n\n` +
              `Ảnh đã xóa: ${details.imagesDeleted}\n` +
              `Posts đã xóa: ${details.postsDeleted}\n` +
              `Sessions đã xóa: ${details.sessionsDeleted}`);
        
        // Refresh stats after cleanup
        fetchSystemStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert('Không thể dọn dẹp dữ liệu: ' + (error as Error).message);
    }
  };

  const updateConfig = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedConfig = (parent: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof SystemConfig],
        [field]: value
      }
    }));
  };

  const backupDatabase = async () => {
    if (!confirm('Tạo backup database? Quá trình này có thể mất vài phút.')) return;
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup_database' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`${data.message}\nBackup ID: ${data.backup_id}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert('Không thể tạo backup: ' + (error as Error).message);
    }
  };

  const optimizeDatabase = async () => {
    if (!confirm('Tối ưu hóa database? Hệ thống có thể chậm trong quá trình này.')) return;
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize_database' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchSystemStats(); // Refresh stats
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert('Không thể tối ưu database: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải cấu hình hệ thống...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-white">Cài đặt hệ thống</h1>
            <p className="text-gray-400 mt-1">Quản lý cấu hình và thiết lập hệ thống</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>

        {/* Save Status */}
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-600/20 border border-green-600/50 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-200">Cài đặt đã được lưu thành công!</span>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài đặt chung</span>
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pricing'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Bảng giá</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'api'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>API & Tích hợp</span>
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Bảo trì</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Cài đặt chung</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên website
                  </label>
                  <input
                    type="text"
                    value={config.siteName}
                    onChange={(e) => updateConfig('siteName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mô tả website
                  </label>
                  <input
                    type="text"
                    value={config.siteDescription}
                    onChange={(e) => updateConfig('siteDescription', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kích thước file tối đa (MB)
                  </label>
                  <input
                    type="number"
                    value={config.maxFileSize}
                    onChange={(e) => updateConfig('maxFileSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Chế độ bảo trì</h4>
                    <p className="text-gray-400 text-sm">Tạm dừng truy cập website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.maintenance}
                      onChange={(e) => updateConfig('maintenance', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Cho phép đăng ký</h4>
                    <p className="text-gray-400 text-sm">Người dùng mới có thể tạo tài khoản</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.registrationEnabled}
                      onChange={(e) => updateConfig('registrationEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing Settings */}
          {activeTab === 'pricing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Bảng giá tokens</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    5,000 Tokens (VND)
                  </label>
                  <input
                    type="number"
                    value={config.tokenPricing.tokens5000}
                    onChange={(e) => updateNestedConfig('tokenPricing', 'tokens5000', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="500000"
                  />
                  <p className="text-xs text-gray-400 mt-1">{config.tokenPricing.tokens5000.toLocaleString('vi-VN')} ₫</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    10,000 Tokens (VND)
                  </label>
                  <input
                    type="number"
                    value={config.tokenPricing.tokens10000}
                    onChange={(e) => updateNestedConfig('tokenPricing', 'tokens10000', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="950000"
                  />
                  <p className="text-xs text-gray-400 mt-1">{config.tokenPricing.tokens10000.toLocaleString('vi-VN')} ₫</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    20,000 Tokens (VND)
                  </label>
                  <input
                    type="number"
                    value={config.tokenPricing.tokens20000}
                    onChange={(e) => updateNestedConfig('tokenPricing', 'tokens20000', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1800000"
                  />
                  <p className="text-xs text-gray-400 mt-1">{config.tokenPricing.tokens20000.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">API & Tích hợp</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={config.openaiApiKey || ''}
                    onChange={(e) => updateConfig('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Key này sẽ được mã hóa khi lưu</p>
                </div>

                <div className="pt-4">
                  <h4 className="text-white font-medium mb-3">Cài đặt Email (SMTP)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="SMTP Host"
                      value={config.emailSettings?.smtpHost || ''}
                      onChange={(e) => updateNestedConfig('emailSettings', 'smtpHost', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="SMTP Port"
                      value={config.emailSettings?.smtpPort || ''}
                      onChange={(e) => updateNestedConfig('emailSettings', 'smtpPort', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="SMTP User"
                      value={config.emailSettings?.smtpUser || ''}
                      onChange={(e) => updateNestedConfig('emailSettings', 'smtpUser', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <input
                      type="password"
                      placeholder="SMTP Password"
                      value={config.emailSettings?.smtpPass || ''}
                      onChange={(e) => updateNestedConfig('emailSettings', 'smtpPass', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Maintenance */}
          {activeTab === 'maintenance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Bảo trì hệ thống</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Xóa cache</h4>
                    <p className="text-gray-400 text-sm">Xóa toàn bộ cache của hệ thống</p>
                  </div>
                  <button
                    onClick={clearCache}
                    className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Xóa cache</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Dọn dẹp dữ liệu</h4>
                    <p className="text-gray-400 text-sm">Xóa ảnh cũ và scheduled posts không cần thiết</p>
                  </div>
                  <button
                    onClick={cleanupOldData}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Dọn dẹp</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Backup Database</h4>
                    <p className="text-gray-400 text-sm">Tạo bản sao lưu toàn bộ database</p>
                  </div>
                  <button
                    onClick={backupDatabase}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    <Database className="w-4 h-4" />
                    <span>Backup</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Tối ưu Database</h4>
                    <p className="text-gray-400 text-sm">Tối ưu hóa hiệu suất database</p>
                  </div>
                  <button
                    onClick={optimizeDatabase}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Tối ưu</span>
                  </button>
                </div>

                {systemStats && (
                  <div className="mt-6">
                    <h4 className="text-white font-medium mb-3">Thống kê hệ thống</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Tổng ảnh</p>
                        <p className="text-2xl font-bold text-white">{systemStats.images?.total || 0}</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Dung lượng</p>
                        <p className="text-2xl font-bold text-white">{systemStats.system?.diskUsage || '0 MB'}</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">RAM</p>
                        <p className="text-2xl font-bold text-white">{systemStats.system?.memoryUsage || '0%'}</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">CPU</p>
                        <p className="text-2xl font-bold text-white">{systemStats.system?.cpuUsage || '0%'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Uptime</p>
                        <p className="text-lg font-bold text-white">{systemStats.system?.uptime || '0 days'}</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Lỗi 24h qua</p>
                        <p className="text-lg font-bold text-white">{systemStats.system?.errors24h || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <Server className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-white font-semibold">Server Status</h3>
                <p className="text-green-500 text-sm">
                  Online • {systemStats?.system?.uptime || 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-white font-semibold">Database</h3>
                <p className="text-blue-500 text-sm">
                  Connected • {systemStats?.templates?.total || 0} templates
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <Shield className={`w-8 h-8 ${(systemStats?.system?.errors24h || 0) === 0 ? 'text-green-500' : 'text-yellow-500'}`} />
              <div>
                <h3 className="text-white font-semibold">Security</h3>
                <p className={`text-sm ${(systemStats?.system?.errors24h || 0) === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {(systemStats?.system?.errors24h || 0) === 0 ? 'All Secure' : `${systemStats?.system?.errors24h} errors`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 