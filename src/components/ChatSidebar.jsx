import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { useChat } from '../contexts/ChatContext';
import { mockApi } from '../services/mockApi';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const ChatSidebar = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { isOpen, setIsOpen, setUnreadCount } = useChat();
  const [activeChats, setActiveChats] = useState([]); // [{ taskId, task, lastMessage, unreadCount }]
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [messages, setMessages] = useState({}); // { taskId: [messages] }
  const [newMessages, setNewMessages] = useState({}); // { taskId: string }

  // Получаем задания, в которых пользователь участвует
  const userTasks = tasks.filter(t => 
    (t.createdBy === user?.id || t.assignedTo === user?.id) && 
    t.status !== 'PENDING' && 
    t.status !== 'REJECTED' &&
    (t.assignedTo || t.createdBy === user?.id)
  );

  // Загружаем последние сообщения для каждого задания
  useEffect(() => {
    const loadChats = async () => {
      if (!user || userTasks.length === 0) return;

      const chatsData = await Promise.all(
        userTasks.map(async (task) => {
          try {
            const taskMessages = await mockApi.getChatMessages(task.id);
            const lastMessage = taskMessages && taskMessages.length > 0 
              ? taskMessages[taskMessages.length - 1]
              : null;
            
            return {
              taskId: task.id,
              task,
              lastMessage,
              unreadCount: 0 // Можно добавить логику подсчета непрочитанных
            };
          } catch (error) {
            console.error(`Error loading chat for task ${task.id}:`, error);
            return null;
          }
        })
      );

      setActiveChats(chatsData.filter(c => c !== null));
    };

    loadChats();
  }, [user, userTasks.length]);

  // Загружаем сообщения для выбранного чата
  useEffect(() => {
    if (!selectedTaskId) return;

    const loadMessages = async () => {
      try {
        const taskMessages = await mockApi.getChatMessages(selectedTaskId);
        setMessages(prev => ({ ...prev, [selectedTaskId]: taskMessages || [] }));
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
    
    // Обновляем сообщения каждые 3 секунды
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedTaskId]);

  const handleSendMessage = async (taskId, text) => {
    if (!text.trim() || !user) return;

    const messageData = {
      taskId,
      senderId: user.id,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const message = await mockApi.sendChatMessage(messageData);
      setMessages(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), message]
      }));
      setNewMessages(prev => ({ ...prev, [taskId]: '' }));
      
      // Обновляем последнее сообщение в списке чатов
      setActiveChats(prev => prev.map(chat => 
        chat.taskId === taskId 
          ? { ...chat, lastMessage: message }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherUser = (task) => {
    if (!user) return null;
    if (user.id === task.createdBy) {
      // Если пользователь создатель, возвращаем волонтера
      return task.assignedTo ? { id: task.assignedTo, name: 'Волонтер' } : null;
    } else {
      // Если пользователь волонтер, возвращаем создателя
      return { id: task.createdBy, name: 'Создатель' };
    }
  };

  const selectedChat = activeChats.find(c => c.taskId === selectedTaskId);
  const selectedTask = selectedChat?.task;
  const selectedMessages = messages[selectedTaskId] || [];

  if (!user) return null;

  return (
    <div className={`fixed left-0 top-16 bottom-0 z-40 flex transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`} style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      {/* Боковая панель */}
      <div className="w-full sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
        {/* Заголовок */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Чаты ({activeChats.length})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto">
          {activeChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Нет активных чатов</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activeChats.map((chat) => {
                const otherUser = getOtherUser(chat.task);
                const isSelected = selectedTaskId === chat.taskId;
                
                return (
                  <button
                    key={chat.taskId}
                    onClick={() => setSelectedTaskId(chat.taskId)}
                    className={`w-full p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0">
                        {otherUser?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {chat.task.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          <span className="sm:hidden">
                            {chat.lastMessage 
                              ? chat.lastMessage.text.length > 20
                                ? chat.lastMessage.text.substring(0, 20) + '...'
                                : chat.lastMessage.text
                              : 'Нет сообщений'}
                          </span>
                          <span className="hidden sm:inline">
                            {chat.lastMessage 
                              ? chat.lastMessage.text.length > 30
                                ? chat.lastMessage.text.substring(0, 30) + '...'
                                : chat.lastMessage.text
                              : 'Нет сообщений'}
                          </span>
                        </div>
                        {chat.lastMessage && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(chat.lastMessage.timestamp).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Окно чата */}
      {selectedTaskId && selectedTask && (
        <div className="w-full sm:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
          {/* Заголовок чата */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                onClick={() => setSelectedTaskId(null)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded sm:mr-2"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0">
                {getOtherUser(selectedTask)?.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {selectedTask.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {getOtherUser(selectedTask)?.name || 'Пользователь'}
                </div>
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedMessages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Нет сообщений. Начните общение!
              </div>
            ) : (
              selectedMessages.map((message) => {
                const isOwn = message.senderId === user.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
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
          </div>

          {/* Форма отправки */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(selectedTaskId, newMessages[selectedTaskId] || '');
            }}
            className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessages[selectedTaskId] || ''}
                onChange={(e) => setNewMessages(prev => ({ ...prev, [selectedTaskId]: e.target.value }))}
                placeholder="Введите сообщение..."
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                type="submit"
                disabled={!newMessages[selectedTaskId]?.trim()}
                className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Отправить</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Кнопка открытия (когда закрыта) - теперь скрыта, так как есть иконка в Navbar */}
    </div>
  );
};

