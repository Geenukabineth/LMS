import React, { useState, useEffect } from 'react';
import { Users, Shield, Activity, FileText, Search, Plus, Edit, Trash2, Eye, Download, Filter, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Mock data
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-06-01 10:30', permissions: ['read', 'write', 'delete'] },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active', lastLogin: '2024-06-01 09:15', permissions: ['read', 'write'] },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Viewer', status: 'Inactive', lastLogin: '2024-05-30 14:22', permissions: ['read'] },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Editor', status: 'Active', lastLogin: '2024-06-01 11:45', permissions: ['read', 'write'] }
  ]);

  const [activities, setActivities] = useState([
    { id: 1, user: 'John Doe', action: 'User Login', timestamp: '2024-06-01 10:30', status: 'success', details: 'Successful login from 192.168.1.100' },
    { id: 2, user: 'Jane Smith', action: 'File Upload', timestamp: '2024-06-01 09:45', status: 'success', details: 'Uploaded document.pdf (2.3MB)' },
    { id: 3, user: 'Mike Johnson', action: 'Permission Change', timestamp: '2024-06-01 08:20', status: 'warning', details: 'Role changed from Editor to Viewer' },
    { id: 4, user: 'Sarah Wilson', action: 'Data Export', timestamp: '2024-06-01 11:15', status: 'success', details: 'Exported user report (250 records)' },
    { id: 5, user: 'System', action: 'Failed Login', timestamp: '2024-06-01 07:30', status: 'error', details: 'Multiple failed login attempts for admin@example.com' }
  ]);

  const [stats, setStats] = useState({
    totalUsers: 4,
    activeUsers: 3,
    adminUsers: 1,
    recentActivity: 15
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));
  };

  const handleDeleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const handleBulkAction = (action) => {
    if (action === 'delete') {
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    }
  };

  const UserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'Viewer',
      status: user?.status || 'Active',
      permissions: user?.permissions || ['read']
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const userData = user 
        ? { ...user, ...formData }
        : { ...formData, id: Date.now(), lastLogin: 'Never' };
      
      if (user) {
        setUsers(prev => prev.map(u => u.id === user.id ? userData : u));
      } else {
        setUsers(prev => [...prev, userData]);
      }
      onSave();
    };

    const handlePermissionChange = (permission) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">{user ? 'Edit User' : 'Add New User'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="space-y-2">
                {['read', 'write', 'delete'].map(permission => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => handlePermissionChange(permission)}
                      className="mr-2"
                    />
                    <span className="capitalize">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {user ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administrator Dashboard</h1>
              <p className="text-gray-600">Manage users, permissions, and monitor system activity</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
          <StatCard title="Active Users" value={stats.activeUsers} icon={CheckCircle} color="bg-green-500" />
          <StatCard title="Admin Users" value={stats.adminUsers} icon={Shield} color="bg-purple-500" />
          <StatCard title="Recent Activities" value={stats.recentActivity} icon={Activity} color="bg-orange-500" />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'users', label: 'User Management', icon: Users },
                { id: 'permissions', label: 'Permissions', icon: Shield },
                { id: 'activity', label: 'Activity Monitor', icon: Activity },
                { id: 'reports', label: 'Reports', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUsers.length > 0 && (
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                      </button>
                    )}
                    <button
                      onClick={() => setShowUserModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserSelect(user.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'Editor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-1">
                              {user.permissions.map(permission => (
                                <span key={permission} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">System Activity Log</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export Log
                  </button>
                </div>

                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(activity.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{activity.user}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-sm text-gray-600">{activity.action}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{activity.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div>
                <h3 className="text-lg font-medium mb-6">Permission Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['Admin', 'Editor', 'Viewer'].map(role => (
                    <div key={role} className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium mb-4">{role} Permissions</h4>
                      <div className="space-y-3">
                        {['read', 'write', 'delete', 'admin'].map(permission => (
                          <label key={permission} className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked={
                                (role === 'Admin') ||
                                (role === 'Editor' && permission !== 'admin' && permission !== 'delete') ||
                                (role === 'Viewer' && permission === 'read')
                              }
                              className="mr-3 rounded"
                            />
                            <span className="capitalize">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-medium mb-6">System Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'User Activity Report', desc: 'Detailed user activity and login statistics', type: 'CSV' },
                    { title: 'Permission Audit', desc: 'Complete audit of user permissions and roles', type: 'PDF' },
                    { title: 'System Performance', desc: 'System usage and performance metrics', type: 'Excel' },
                    { title: 'Security Log', desc: 'Security events and access attempts', type: 'CSV' },
                    { title: 'User Registration', desc: 'New user registrations and trends', type: 'PDF' },
                    { title: 'Admin Actions', desc: 'Administrative actions and changes', type: 'CSV' }
                  ].map((report, index) => (
                    <div key={index} className="bg-white border rounded-lg p-6">
                      <h4 className="font-medium mb-2">{report.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{report.desc}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{report.type}</span>
                        <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                          <Download className="h-3 w-3 mr-1" />
                          Generate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;