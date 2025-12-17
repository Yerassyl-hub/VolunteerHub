import React, { useState, useEffect } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { mockApi } from '../../services/mockApi';
import { TaskCard } from '../TaskCard';

export default function AdminDashboard() {
  const { tasks, updateTaskStatus } = useTasks();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await mockApi.getUsers();
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleApprove = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'OPEN');
    } catch (error) {
      console.error('Error approving task:', error);
      alert('Ошибка при одобрении задания');
    }
  };

  const handleReject = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'REJECTED');
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Ошибка при отклонении задания');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const reviewTasks = tasks.filter(t => t.status === 'REVIEW');
  const allTasks = tasks;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель администратора</h1>
        <p className="text-gray-600">Управление заданиями и модерация</p>
      </div>

      {/* Задания на проверке (PENDING) */}
      {pendingTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            Задания на проверке ({pendingTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Отчеты на проверке (REVIEW) */}
      {reviewTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Отчеты на проверке ({reviewTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Все задания */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Все задания в системе</h2>
        {allTasks.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">Нет заданий в системе</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Всего заданий</div>
          <div className="text-2xl font-bold text-gray-900">{allTasks.length}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 shadow-card border border-amber-100">
          <div className="text-sm text-amber-700 mb-1">На проверке</div>
          <div className="text-2xl font-bold text-amber-900">{pendingTasks.length}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-card border border-blue-100">
          <div className="text-sm text-blue-700 mb-1">Отчеты</div>
          <div className="text-2xl font-bold text-blue-900">{reviewTasks.length}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 shadow-card border border-emerald-100">
          <div className="text-sm text-emerald-700 mb-1">Открытые</div>
          <div className="text-2xl font-bold text-emerald-900">
            {allTasks.filter(t => t.status === 'OPEN').length}
          </div>
        </div>
      </div>
    </div>
  );
}
