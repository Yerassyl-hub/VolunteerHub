import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { mockApi } from '../services/mockApi';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import UserDashboard from '../components/dashboards/UserDashboard';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { tasks, updateTaskStatus, abandonTask } = useTasks();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isAdmin()) {
      mockApi.getUsers().then(setUsers).catch(console.error);
    }
  }, [isAdmin]);

  if (!user) {
    return null;
  }

  const handleTake = (id) => updateTaskStatus(id, 'in_progress');
  const handleComplete = (id) => updateTaskStatus(id, 'pending_approval');
  const handleRefuse = (id) => abandonTask(id);

  const handleApprove = (id) => updateTaskStatus(id, 'open');
  const handleReject = (id) => updateTaskStatus(id, 'rejected');
  
  if (isAdmin()) {
    return (
      <AdminDashboard 
        tasks={tasks} 
        users={users} 
        onApprove={handleApprove} 
        onReject={handleReject}
      />
    );
  }

  return (
    <UserDashboard 
      user={user}
      tasks={tasks}
      onTake={handleTake}
      onComplete={handleComplete}
      onRefuse={handleRefuse}
    />
  );
};
