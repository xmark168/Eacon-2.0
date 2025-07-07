'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File, Search, Edit, Trash2, Plus, Eye, Star, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  platform: string;
  tags: string[];
  cost: number;
  unlockCost: number;
  category: string;
  type: string;
  requiresUpload: boolean;
  isActive: boolean;
  usageCount: number;
  unlockCount: number;
  createdAt: string;
  updatedAt: string;
}



export default function AdminTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    style: '',
    platform: '',
    tags: '',
    cost: '0',
    unlockCost: '100',
    category: '',
    type: 'GENERATE',
    requiresUpload: false,
    isActive: true,
    // Chỉ giữ lại previewImage
    previewImage: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/templates?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API error');
      }
      
      setTemplates(data.data);
      // setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Không thể tải danh sách templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && template.isActive) ||
                         (statusFilter === 'inactive' && !template.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleTemplateStatus = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          ...template,
          isActive: !template.isActive
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update template');
      }
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === id ? { ...t, isActive: !t.isActive } : t
      ));
    } catch (err) {
      alert('Không thể cập nhật trạng thái template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;
    
    try {
      const response = await fetch(`/api/admin/templates?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      // Update local state
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      alert('Không thể xóa template');
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      prompt: '',
      style: '',
      platform: '',
      tags: '',
      cost: '0',
      unlockCost: '100',
      category: '',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
      previewImage: ''
    });
    setShowCreateModal(true);
  };

  const openEditModal = (template: TemplateItem) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      prompt: template.prompt,
      style: template.style,
      platform: template.platform,
      tags: template.tags.join(', '),
      cost: template.cost.toString(),
      unlockCost: template.unlockCost.toString(),
      category: template.category,
      type: template.type,
      requiresUpload: template.requiresUpload,
      isActive: template.isActive,
      previewImage: (template as any).previewImage || ''
    });
    setShowCreateModal(true);
  };

  const saveTemplate = async () => {
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        cost: parseInt(formData.cost),
        unlockCost: parseInt(formData.unlockCost),
        ...(editingTemplate && { id: editingTemplate.id })
      };
      
      const response = await fetch('/api/admin/templates', {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      // Refresh list
      await fetchTemplates();
      setShowCreateModal(false);
    } catch (err) {
      alert('Không thể lưu template');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải danh sách templates...</p>
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
              onClick={fetchTemplates}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Thử lại
            </button>
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
            <h1 className="text-3xl font-bold text-white">Quản lý Templates</h1>
            <p className="text-gray-400 mt-1">Quản lý các templates AI và nội dung</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Template</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <File className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400 text-sm">Tổng Templates</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{templates.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-500" />
              <span className="text-gray-400 text-sm">Đang hoạt động</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {templates.filter(t => t.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Tổng lượt sử dụng</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {templates.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-500" />
              <span className="text-gray-400 text-sm">Danh mục</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm template theo tên hoặc nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
            >
              {/* Preview Image */}
              {(template as any).previewImage && (
                <div className="mb-4">
                  <img 
                    src={(template as any).previewImage} 
                    alt={template.title}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{template.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {template.category}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {template.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-400">{template.cost} tokens</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                {template.description}
              </p>

              {/* Prompt */}
              <p className="text-gray-300 text-xs mb-4 line-clamp-2 italic">
                "{template.prompt}"
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-4 text-sm text-gray-400">
                  <span>Sử dụng: <span className="text-white font-medium">{template.usageCount.toLocaleString('vi-VN')}</span></span>
                  <span>Mở khóa: <span className="text-white font-medium">{template.unlockCount.toLocaleString('vi-VN')}</span></span>
                </div>
                <div className={`flex items-center space-x-1 ${template.isActive ? 'text-green-500' : 'text-gray-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="text-xs">{template.isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Cập nhật: {new Date(template.updatedAt).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-400 hover:text-blue-300 p-1" title="Xem chi tiết">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openEditModal(template)}
                    className="text-green-400 hover:text-green-300 p-1" 
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleTemplateStatus(template.id)}
                    className={`p-1 ${template.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                    title={template.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                  >
                    {template.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button 
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Xóa template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <File className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Không tìm thấy template nào phù hợp với tiêu chí</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingTemplate ? 'Chỉnh sửa Template' : 'Tạo Template mới'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Tiêu đề</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Prompt</label>
                  <textarea
                    value={formData.prompt}
                    onChange={e => setFormData({...formData, prompt: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Danh mục</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Loại</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="GENERATE">Generate</option>
                      <option value="TRANSFORM">Transform</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Chi phí (tokens)</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={e => setFormData({...formData, cost: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Chi phí mở khóa</label>
                    <input
                      type="number"
                      value={formData.unlockCost}
                      onChange={e => setFormData({...formData, unlockCost: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Tags (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                
                {/* Thêm trường ảnh preview */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Ảnh preview</label>
                  <input
                    type="url"
                    value={formData.previewImage}
                    onChange={e => setFormData({...formData, previewImage: e.target.value})}
                    placeholder="https://example.com/preview.jpg"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">URL ảnh sẽ hiển thị trong gallery templates</p>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.requiresUpload}
                      onChange={e => setFormData({...formData, requiresUpload: e.target.checked})}
                      className="rounded border-gray-600 bg-gray-700 text-red-600"
                    />
                    <span className="text-sm text-gray-300">Yêu cầu upload ảnh</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="rounded border-gray-600 bg-gray-700 text-red-600"
                    />
                    <span className="text-sm text-gray-300">Kích hoạt</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 