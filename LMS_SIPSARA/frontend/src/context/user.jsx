import api from '../api/axios';

// Get logged-in user
export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// Update logged-in user
export const updateCurrentUser = async (data) => {
  const response = await api.patch('/users/me', data);
  return response.data;
};

// Create new user
export const createUser = async (user) => {
  const response = await api.post('/users', user);
  return response.data;
};

// Get all users
export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

// Get user by ID
export const getUserById = async (userId) => {
  const response = await api.get(/users/${userId});
  return response.data;
};

// Update user by ID
export const updateUser = async (userId, data) => {
  const response = await api.patch(/users/${userId}, data);
  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const response = await api.delete(/users/${userId});
  return response.data;
};

// Reactivate user
export const reactivateUser = async (userId) => {
  const response = await api.patch(/users/${userId}/reactivate);
  return response.data;
};