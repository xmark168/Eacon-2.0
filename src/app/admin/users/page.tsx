'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  UserCheck,
  UserX,
  Plus,
  Download,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  tokens: number;
  accountType: 'FREE' | 'CREATOR' | 'PRO' | 'PREMIUM';
  planExpiresAt: string | null;
  totalImages: number;
  totalPayments: number;
  totalTransactions: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}



export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | 'FREE' | 'CREATOR' | 'PRO' | 'PREMIUM'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editTokens, setEditTokens] = useState('0');
  const [editAccountType, setEditAccountType] = useState<User['accountType']>('FREE');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users?limit=100');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API error');
      }
      
      const formattedUsers: User[] = data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name || 'Chưa đặt tên',
        image: user.image,
        tokens: user.tokens || 0,
        accountType: user.accountType,
        planExpiresAt: user.planExpiresAt,
        totalImages: user.totalImages,
        totalPayments: user.totalPayments,
        totalTransactions: user.totalTransactions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive
      }));
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    // Account type filter
    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.accountType === accountTypeFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, accountTypeFilter]);

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length
        ? []
        : filteredUsers.map(user => user.id)
    );
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditTokens(String(user.tokens));
    setEditAccountType(user.accountType);
    setShowUserMenu(null);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      setSaving(true);
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          tokens: parseInt(editTokens),
          accountType: editAccountType
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');

      setUsers(prev => prev.map(u => (u.id === editingUser.id ? { ...u, tokens: parseInt(editTokens), accountType: editAccountType } : u)));
      setEditingUser(null);
    } catch (err) {
      alert('Không thể lưu: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'edit' | 'ban' | 'unban' | 'delete') => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (action === 'edit') {
      openEditModal(target);
      return;
    }

    if (action === 'delete') {
      if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    }

    try {
      if (action === 'ban' || action === 'unban') {
        await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            planExpiresAt: action === 'ban' ? new Date(Date.now() - 86400000).toISOString() : null
          })
        });
      } else if (action === 'delete') {
        await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      }

      // Refetch list
      fetchUsers();
    } catch (err) {
      alert('Thao tác thất bại');
    }

    setShowUserMenu(null);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getAccountTypeColor = (accountType: User['accountType']) => {
    switch (accountType) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      case 'CREATOR':
        return 'bg-blue-100 text-blue-800';
      case 'PRO':
        return 'bg-purple-100 text-purple-800';
      case 'PREMIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Modal component (simple)
  const EditModal = () => {
    if (!editingUser) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 w-full max-w-md p-6 rounded-lg border border-gray-700 space-y-4">
          <h2 className="text-xl font-semibold text-white">Chỉnh sửa người dùng</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Tokens</label>
              <input type="number" value={editTokens} onChange={e => setEditTokens(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Gói</label>
              <select value={editAccountType} onChange={e => setEditAccountType(e.target.value as User['accountType'])} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none">
                {['FREE','CREATOR','PRO','PREMIUM'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">Hủy</button>
            <button disabled={saving} onClick={saveEdit} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải danh sách users...</p>
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
            <h1 className="text-3xl font-bold text-white">Quản lý Users</h1>
            <p className="text-gray-400 mt-1">Quản lý tài khoản người dùng và quyền hạn</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Xuất dữ liệu</span>
            </button>
            <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span>Thêm người dùng</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400 text-sm">Tổng Users</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-gray-400 text-sm">Đang hoạt động</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {users.filter(u => u.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Không hoạt động</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {users.filter(u => !u.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-purple-500" />
              <span className="text-gray-400 text-sm">Có gói trả phí</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {users.filter(u => u.accountType !== 'FREE').length}
            </p>
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
                  placeholder="Tìm kiếm user theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>

            {/* Account Type Filter */}
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value as typeof accountTypeFilter)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả gói</option>
              <option value="FREE">Free</option>
              <option value="CREATOR">Creator</option>
              <option value="PRO">Pro</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Gói
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ảnh đã tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}>
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(user.accountType)}`}>
                        {user.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {user.tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {user.totalImages.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="relative">
                        <button
                          onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {showUserMenu === user.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-10"
                          >
                            <button
                              onClick={() => handleUserAction(user.id, 'edit')}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </button>
                            {!user.isActive ? (
                              <button
                                onClick={() => handleUserAction(user.id, 'unban')}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Kích hoạt
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.id, 'ban')}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Vô hiệu hóa
                              </button>
                            )}
                            <button
                              onClick={() => handleUserAction(user.id, 'delete')}
                              className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa người dùng
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Không tìm thấy người dùng nào phù hợp với tiêu chí tìm kiếm</p>
            </div>
          )}
        </div>

        <EditModal />

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm transition-colors">
                  <Ban className="w-4 h-4" />
                  <span>Ban</span>
                </button>
                <button className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
} 