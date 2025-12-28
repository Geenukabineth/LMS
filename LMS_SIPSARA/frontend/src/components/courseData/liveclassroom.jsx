// React Frontend - Google Classroom Integration
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Users, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

// OAuth Service
const ClassroomAuthService = {
  async getAuthUrl() {
    const response = await axios.get(`${API_BASE_URL}/auth/get_auth_url/`);
    return response.data.auth_url;
  },

  async handleCallback(code, state) {
    const response = await axios.post(`${API_BASE_URL}/auth/callback/`, { code, state });
    return response.data;
  }
};

// Classroom Service
const ClassroomService = {
  async getClassrooms() {
    const response = await axios.get(`${API_BASE_URL}/classrooms/`);
    return response.data;
  },

  async syncClassrooms() {
    const response = await axios.post(`${API_BASE_URL}/classrooms/sync_classrooms/`);
    return response.data;
  },

  async syncStudents(classroomId) {
    const response = await axios.post(
      `${API_BASE_URL}/classrooms/${classroomId}/sync_students/`
    );
    return response.data;
  },

  async syncAssignments(classroomId) {
    const response = await axios.post(
      `${API_BASE_URL}/classrooms/${classroomId}/sync_assignments/`
    );
    return response.data;
  }
};

// Login Component
export function ClassroomLogin() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const authUrl = await ClassroomAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Auth error:', error);
      alert('Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
        <BookOpen className="w-16 h-16 mx-auto mb-6 text-blue-600" />
        <h1 className="mb-2 text-3xl font-bold text-center">Classroom Sync</h1>
        <p className="mb-8 text-center text-gray-600">
          Connect your Google Classroom to get started
        </p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center justify-center w-full gap-2 px-4 py-3 font-bold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? <Loader className="animate-spin" /> : null}
          {loading ? 'Connecting...' : 'Connect Google Classroom'}
        </button>
      </div>
    </div>
  );
}

// Callback Handler Component
export function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      try {
        await ClassroomAuthService.handleCallback(code, state);
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Callback error:', error);
        window.location.href = '/login?error=auth_failed';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 animate-spin" />
    </div>
  );
}

// Sync Button Component
function SyncButton({ onClick, loading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
    >
      {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
      {label}
    </button>
  );
}

// Classroom Card Component
function ClassroomCard({ classroom, onSyncStudents, onSyncAssignments, syncLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const handleSyncStudents = async () => {
    setLoadingStudents(true);
    try {
      await onSyncStudents(classroom.id);
      // In real app, fetch and display students
      setStudents([{ id: 1, name: 'Student 1' }, { id: 2, name: 'Student 2' }]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSyncAssignments = async () => {
    setLoadingAssignments(true);
    try {
      await onSyncAssignments(classroom.id);
      // In real app, fetch and display assignments
      setAssignments([{ id: 1, title: 'Assignment 1' }, { id: 2, title: 'Assignment 2' }]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  return (
    <div className="p-6 mb-4 bg-white border-l-4 border-blue-600 rounded-lg shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800">{classroom.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{classroom.description}</p>
          <p className="mt-2 text-xs text-gray-500">
            Last synced: {new Date(classroom.synced_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-semibold text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {expanded && (
        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <SyncButton
              onClick={handleSyncStudents}
              loading={loadingStudents}
              label="Sync Students"
            />
            <SyncButton
              onClick={handleSyncAssignments}
              loading={loadingAssignments}
              label="Sync Assignments"
            />
          </div>

          {students.length > 0 && (
            <div className="mb-6">
              <h4 className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <Users className="w-4 h-4" /> Students ({students.length})
              </h4>
              <div className="space-y-2">
                {students.map(student => (
                  <div key={student.id} className="p-3 rounded bg-blue-50">
                    {student.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignments.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <FileText className="w-4 h-4" /> Assignments ({assignments.length})
              </h4>
              <div className="space-y-2">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="p-3 rounded bg-purple-50">
                    {assignment.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export default function ClassroomDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await ClassroomService.getClassrooms();
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      alert('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const result = await ClassroomService.syncClassrooms();
      alert(`Synced ${result.synced} classrooms`);
      fetchClassrooms();
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync classrooms');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">My Classrooms</h1>
          <SyncButton
            onClick={handleSyncAll}
            loading={syncing}
            label="Sync All Classrooms"
          />
        </div>

        {classrooms.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-lg">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">No classrooms found</p>
          </div>
        ) : (
          <div>
            {classrooms.map(classroom => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                onSyncStudents={(id) => ClassroomService.syncStudents(id)}
                onSyncAssignments={(id) => ClassroomService.syncAssignments(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}