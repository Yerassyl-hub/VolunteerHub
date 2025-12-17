import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const useTasks = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Если пользователь не залогинен, очищаем задачи
        if (!user) {
          setTasks([]);
          return;
        }
        const data = await mockApi.getTasks(user?.id, user?.role);
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      }
    };
    fetchTasks();
  }, [user]);

  const createTask = async (taskData) => {
    if (!user?.id) {
      throw new Error('Пользователь не авторизован');
    }
    const taskWithUser = { ...taskData, createdBy: user.id };
    const newTask = await mockApi.createTask(taskWithUser); 
    setTasks(prev => [...prev, newTask]);
    // Обновляем пользователя после списания баллов
    await refreshUser();
    return newTask;
  };

  const updateTaskStatus = async (taskId, status, reportData = null) => {
    if (!user?.id) {
      throw new Error('Пользователь не авторизован');
    }
    const updatedTask = await mockApi.updateTaskStatus(taskId, status, user.id, reportData);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    // Обновляем пользователя после начисления баллов (если статус DONE)
    if (status === 'DONE') {
      await refreshUser();
    }
    return updatedTask;
  };

  const abandonTask = async (taskId) => {
    if (!user?.id) {
      throw new Error('Пользователь не авторизован');
    }
    const { task } = await mockApi.abandonTask(taskId, user.id);
    setTasks(prev => prev.map(t => t.id === taskId ? task : t));
    // Обновляем пользователя после списания штрафа
    await refreshUser();
  };

  const value = {
    tasks,
    createTask,
    updateTaskStatus,
    abandonTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
