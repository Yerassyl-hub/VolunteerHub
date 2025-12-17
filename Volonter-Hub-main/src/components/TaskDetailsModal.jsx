import React from 'react';
import { mockApi } from '../services/mockApi';

export const TaskDetailsModal = ({ isOpen, onClose, task, user, isAdmin }) => {
  const [creatorInfo, setCreatorInfo] = React.useState(null);
  const [volunteerInfo, setVolunteerInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && task) {
      const fetchUserInfo = async () => {
        setLoading(true);
        try {
          const users = await mockApi.getUsers();
          if (task.createdBy) {
            const creator = users.find(u => u.id === task.createdBy);
            setCreatorInfo(creator);
          }
          if (task.assignedTo) {
            const volunteer = users.find(u => u.id === task.assignedTo);
            setVolunteerInfo(volunteer);
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserInfo();
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  // Показываем контакты создателя если:
  // - Админ видит все
  // - Пользователь взял задание (assignedTo === user.id)
  // - Пользователь создал задание (createdBy === user.id)
  const canSeeCreatorContacts = isAdmin || task.assignedTo === user?.id || task.createdBy === user?.id;

  // Показываем контакты волонтера если:
  // - Админ видит все
  // - Пользователь создал задание (createdBy === user.id)
  const canSeeVolunteerContacts = isAdmin || task.createdBy === user?.id;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-gray-950/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Заголовок */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
              Создано {new Date(task.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Фото */}
          {task.imageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img 
                src={task.imageUrl} 
                alt={task.title}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                }}
              />
            </div>
          )}

          {/* Описание */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Описание задания</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{task.description}</p>
          </div>

          {/* Информация о задании */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Город</div>
              <div className="font-semibold text-gray-900 dark:text-white">{task.city}</div>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
              <div className="text-sm text-primary-600 dark:text-primary-400 mb-1">Баллы</div>
              <div className="font-bold text-primary-700 dark:text-primary-300 text-xl">{task.points}</div>
            </div>
          </div>

          {/* Адрес */}
          {task.address && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Адрес задания
              </h4>
              <p className="text-gray-700 dark:text-gray-300">{task.address}</p>
            </div>
          )}

          {/* Все фото задания */}
          {(task.images && task.images.length > 0) && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Фото задания</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {task.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(img, '_blank')}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Контакты создателя */}
          {canSeeCreatorContacts && creatorInfo && (
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Контакты создателя задания
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Имя:</span>
                  <span>{creatorInfo.name}</span>
                </div>
                {task.phone && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${task.phone}`} className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
                      {task.phone}
                    </a>
                  </div>
                )}
                {task.contactInfo && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">{task.contactInfo}</span>
                  </div>
                )}
                {creatorInfo.email && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${creatorInfo.email}`} className="text-primary-600 hover:text-primary-700 hover:underline">
                      {creatorInfo.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Контакты волонтера */}
          {canSeeVolunteerContacts && volunteerInfo && task.assignedTo && (
            <div className="mb-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
              <h4 className="text-sm font-semibold text-violet-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Контакты исполнителя
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Имя:</span>
                  <span>{volunteerInfo.name}</span>
                </div>
                {volunteerInfo.email && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${volunteerInfo.email}`} className="text-primary-600 hover:text-primary-700 hover:underline">
                      {volunteerInfo.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Отчет */}
          {task.report && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">Отчет исполнителя</h4>
              <p className="text-gray-700 mb-3 italic">"{task.report.description}"</p>
              {task.report.imageUrl && (
                <a 
                  href={task.report.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Смотреть фото-доказательство
                </a>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-4 text-gray-500">Загрузка...</div>
          )}
        </div>
      </div>
    </div>
  );
};

