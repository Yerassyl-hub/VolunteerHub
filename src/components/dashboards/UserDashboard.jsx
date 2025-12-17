import React, { useState, useMemo } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { TaskCard } from '../TaskCard';
import { Link } from 'react-router-dom';
import { MapView } from '../MapView';
import { ChatSidebar } from '../ChatSidebar';

// Координаты городов Казахстана для расчета расстояния (fallback если нет координат в задании)
const cityCoordinates = {
  'Алматы': { lat: 43.2220, lng: 76.8512 },
  'Астана': { lat: 51.1694, lng: 71.4491 },
  'Шымкент': { lat: 42.3419, lng: 69.5901 },
  'Актобе': { lat: 50.2833, lng: 57.1667 },
  'Караганда': { lat: 49.8014, lng: 73.1059 },
  'Тараз': { lat: 42.9000, lng: 71.3667 },
  'Павлодар': { lat: 52.3000, lng: 76.9500 },
  'Усть-Каменогорск': { lat: 49.9500, lng: 82.6167 },
  'Семей': { lat: 50.4111, lng: 80.2275 },
  'Костанай': { lat: 53.2167, lng: 63.6333 },
  'Кызылорда': { lat: 44.8500, lng: 65.5167 },
  'Петропавловск': { lat: 54.8667, lng: 69.1500 },
};

// Функция расчета расстояния между двумя точками (формула гаверсинуса)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { tasks } = useTasks();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'my', 'in-progress'
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'points', 'newest'
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }

  // Задания, созданные пользователем
  const myCreatedTasks = tasks.filter(t => t.createdBy === user?.id);
  
  // Задания, взятые пользователем в работу
  const myInProgressTasks = tasks.filter(t => t.assignedTo === user?.id && t.status === 'IN_PROGRESS');
  
  // Получаем геолокацию пользователя
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Если геолокация недоступна, используем Алматы по умолчанию
          setUserLocation(cityCoordinates['Алматы']);
        }
      );
    } else {
      setUserLocation(cityCoordinates['Алматы']);
    }
  }, []);

  // Доступные задания (открытые, не созданные пользователем, не взятые другими)
  const availableTasksRaw = tasks.filter(t => 
    t.status === 'OPEN' && t.createdBy !== user?.id && !t.assignedTo
  );

  // Сортировка заданий
  const availableTasks = useMemo(() => {
    if (!userLocation) return availableTasksRaw;
    
    const tasksWithDistance = availableTasksRaw.map(task => {
      // Используем реальные координаты из задания, если они есть
      let taskCoords;
      if (task.latitude && task.longitude) {
        taskCoords = { lat: parseFloat(task.latitude), lng: parseFloat(task.longitude) };
      } else if (task.coordinates && task.coordinates.lat && task.coordinates.lng) {
        taskCoords = { lat: parseFloat(task.coordinates.lat), lng: parseFloat(task.coordinates.lng) };
      } else {
        // Fallback на координаты города
        taskCoords = cityCoordinates[task.city] || cityCoordinates['Алматы'];
      }
      
      // Вычисляем расстояние только если есть валидные координаты
      let distance = null;
      if (taskCoords && taskCoords.lat && taskCoords.lng && !isNaN(taskCoords.lat) && !isNaN(taskCoords.lng)) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          taskCoords.lat,
          taskCoords.lng
        );
      }
      
      return { ...task, distance, coordinates: taskCoords };
    });

    switch (sortBy) {
      case 'distance':
        return [...tasksWithDistance].sort((a, b) => a.distance - b.distance);
      case 'points':
        return [...tasksWithDistance].sort((a, b) => (b.points || 0) - (a.points || 0));
      case 'newest':
        return [...tasksWithDistance].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      default:
        return tasksWithDistance;
    }
  }, [availableTasksRaw, sortBy, userLocation]);

  // Все задания пользователя (созданные + взятые)
  const allMyTasks = tasks.filter(t => 
    t.createdBy === user?.id || t.assignedTo === user?.id
  );

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Боковая панель чата */}
      <ChatSidebar />
      
      {/* Основной контент с отступом для чата */}
      <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Добро пожаловать, {user.name}!</h1>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
          <div className="flex-1 min-w-[100px]">
            <div className="text-xs sm:text-sm opacity-90">Ваши баллы</div>
            <div className="text-2xl sm:text-3xl font-bold">{user.points || 0}</div>
          </div>
          <div className="hidden sm:block h-12 w-px bg-white/30"></div>
          <div className="flex-1 min-w-[100px]">
            <div className="text-xs sm:text-sm opacity-90">Заданий в работе</div>
            <div className="text-2xl sm:text-3xl font-bold">{myInProgressTasks.length}</div>
          </div>
          <div className="hidden sm:block h-12 w-px bg-white/30"></div>
          <div className="flex-1 min-w-[100px]">
            <div className="text-xs sm:text-sm opacity-90">Создано заданий</div>
            <div className="text-2xl sm:text-3xl font-bold">{myCreatedTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 min-w-[120px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Лента помощи
            {availableTasks.length > 0 && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                {availableTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 min-w-[120px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'my'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Мои задания
            {myCreatedTasks.length > 0 && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                {myCreatedTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`flex-1 min-w-[120px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'in-progress'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            В работе
            {myInProgressTasks.length > 0 && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
                {myInProgressTasks.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Лента помощи */}
          {activeTab === 'feed' && (
            <div>
              {/* Сортировка */}
              {availableTasks.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Сортировать:</span>
                  <button
                    onClick={() => setSortBy('distance')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'distance'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    По близости
                  </button>
                  <button
                    onClick={() => setSortBy('points')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'points'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    По бонусам
                  </button>
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'newest'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Новые
                  </button>
                </div>
              )}
              
              {availableTasks.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Нет доступных заданий</p>
                  <Link
                    to="/create-task"
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    Создать задание
                  </Link>
                </div>
              ) : (
                <>
                  {/* Карта с заданиями - улучшенная версия */}
                  {userLocation && availableTasks.length > 0 && (
                    <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">Карта заданий</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Найдено заданий: {availableTasks.length}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  setUserLocation({
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                  });
                                },
                                () => alert('Не удалось определить местоположение. Разрешите доступ к геолокации в настройках браузера.')
                              );
                            } else {
                              alert('Геолокация не поддерживается вашим браузером');
                            }
                          }}
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="hidden sm:inline">Обновить местоположение</span>
                          <span className="sm:hidden">Обновить</span>
                        </button>
                      </div>
                      
                      {/* Карта OpenStreetMap */}
                      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden mb-4 shadow-inner">
                        <div className="h-[300px] sm:h-[500px] w-full">
                          <MapView 
                            userLocation={userLocation}
                            tasks={availableTasks}
                            cityCoordinates={cityCoordinates}
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full shadow-md"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Ваше местоположение</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full shadow-md"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Задания ({availableTasks.length})</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {/* Мобильная версия - показываем первые 3 */}
                          {availableTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="sm:hidden text-xs bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg border border-primary-200 dark:border-primary-800">
                              <span className="font-semibold text-primary-700 dark:text-primary-300">{task.city}</span>
                              {task.distance && (
                                <span className="text-primary-600 dark:text-primary-400 ml-1">
                                  • {task.distance < 1 
                                    ? `${Math.round(task.distance * 1000)} м` 
                                    : `${task.distance.toFixed(1)} км`}
                                </span>
                              )}
                            </div>
                          ))}
                          {/* Десктопная версия - показываем первые 6 */}
                          {availableTasks.slice(0, 6).map(task => (
                            <div key={task.id} className="hidden sm:block text-xs bg-primary-50 dark:bg-primary-900/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-primary-200 dark:border-primary-800">
                              <span className="font-semibold text-primary-700 dark:text-primary-300">{task.city}</span>
                              {task.distance && (
                                <span className="text-primary-600 dark:text-primary-400 ml-1">
                                  • {task.distance < 1 
                                    ? `${Math.round(task.distance * 1000)} м` 
                                    : `${task.distance.toFixed(1)} км`}
                                </span>
                              )}
                            </div>
                          ))}
                          {/* Счетчик для мобильной версии */}
                          {availableTasks.length > 3 && (
                            <div className="sm:hidden text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400">
                              +{availableTasks.length - 3} еще
                            </div>
                          )}
                          {/* Счетчик для десктопной версии */}
                          {availableTasks.length > 6 && (
                            <div className="hidden sm:block text-xs bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-gray-600 dark:text-gray-400">
                              +{availableTasks.length - 6} еще
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Список заданий */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {availableTasks.map(task => (
                      <div key={task.id} className="relative">
                        <TaskCard task={task} />
                        {task.distance && (
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-primary-600 border border-primary-200 z-10">
                            📍 {task.distance < 1 
                              ? `${Math.round(task.distance * 1000)} м` 
                              : `${task.distance.toFixed(1)} км`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Мои задания */}
          {activeTab === 'my' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Задания, которые я создал</h3>
                <Link
                  to="/create-task"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
                >
                  + Создать задание
                </Link>
              </div>
              {myCreatedTasks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-500 mb-4">Вы еще не создали ни одного задания</p>
                  <Link
                    to="/create-task"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-medium"
                  >
                    Создать первое задание
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {myCreatedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* В работе */}
          {activeTab === 'in-progress' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Задания, которые я выполняю</h3>
              {myInProgressTasks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-500">У вас нет заданий в работе</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Перейдите во вкладку "Лента помощи" чтобы взять задание</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {myInProgressTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
