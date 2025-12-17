import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockApi } from '../services/mockApi';

export const Chat = ({ taskId, task }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadChat = async () => {
      if (!task || !user) return;
      
      setLoading(true);
      try {
        // Определяем собеседника
        let otherUserId;
        if (user.id === task.createdBy) {
          otherUserId = task.assignedTo;
        } else if (user.id === task.assignedTo) {
          otherUserId = task.createdBy;
        } else {
          return; // Пользователь не участвует в задании
        }

        if (otherUserId) {
          const users = await mockApi.getUsers();
          const other = users.find(u => u.id === otherUserId);
          setOtherUser(other);
        }

        // Загружаем сообщения
        const chatMessages = await mockApi.getChatMessages(taskId);
        setMessages(chatMessages || []);
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [taskId, task, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !task || !user) return;

    const messageData = {
      taskId,
      senderId: user.id,
      text: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const message = await mockApi.sendChatMessage(messageData);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Ошибка отправки сообщения');
    }
  };

  if (!task || !user) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Задание не найдено
      </div>
    );
  }

  const otherUserId = user.id === task.createdBy ? task.assignedTo : task.createdBy;
  if (!otherUserId) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Задание еще не взято волонтером
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Заголовок чата */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
            {otherUser?.name?.[0] || '?'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {otherUser?.name || 'Пользователь'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {task.title}
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Загрузка сообщений...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Нет сообщений. Начните общение!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
};

