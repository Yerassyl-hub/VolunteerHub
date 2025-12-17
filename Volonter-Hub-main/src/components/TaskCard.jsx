import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { CompleteTaskModal } from './CompleteTaskModal';
import { TaskDetailsModal } from './TaskDetailsModal';

const statusLabels = {
  PENDING: { label: 'На проверке', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  OPEN: { label: 'Поиск волонтера', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IN_PROGRESS: { label: 'В работе', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  REVIEW: { label: 'Проверка отчета', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  DONE: { label: 'Выполнено', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  REJECTED: { label: 'Отклонено', color: 'bg-red-50 text-red-700 border-red-200' }
};

export const TaskCard = ({ task }) => {
  const { user, isAdmin, isUser } = useAuth();
  const { updateTaskStatus, abandonTask } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTakeTask = async () => await updateTaskStatus(task.id, 'IN_PROGRESS');
  
  const onCompleteClick = () => setIsModalOpen(true);

  // Обработка отказа волонтера
  const handleAbandonClick = async () => {
    const penalty = Math.floor(task.points * 0.5);
    const isConfirmed = window.confirm(
      `Вы уверены, что хотите отказаться? \n\nС вас будет списан штраф: ${penalty} баллов.\nЭти баллы перейдут владельцу задания.`
    );

    if (isConfirmed) {
      setLoading(true);
      try {
        await abandonTask(task.id);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitReport = async (reportData) => {
    setLoading(true);
    try {
      await updateTaskStatus(task.id, 'REVIEW', reportData);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Ошибка при отправке отчета');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => await updateTaskStatus(task.id, 'OPEN');
  
  // Для PENDING (модерация нового задания) - полный отказ
  const handleReject = async () => await updateTaskStatus(task.id, 'REJECTED');
  
  // Для REVIEW (модерация отчета) - возврат на доработку
  const handleRejectReport = async () => {
    if (window.confirm('Отклонить отчет и вернуть задание волонтеру на доработку?')) {
      // Возвращаем статус IN_PROGRESS, исполнитель остается тот же
      await updateTaskStatus(task.id, 'IN_PROGRESS'); 
    }
  };

  const handleConfirmCompletion = async () => await updateTaskStatus(task.id, 'DONE');

  const statusInfo = statusLabels[task.status] || statusLabels.PENDING;
  
  // Проверяем статус и роль - используем прямую проверку роли
  const isAdminUser = user?.role === 'ADMIN' || isAdmin();
  // Проверяем статус - используем и точное совпадение и label
  const isPendingStatus = task.status === 'PENDING' || statusInfo.label === 'На проверке';
  const isReviewStatus = task.status === 'REVIEW' || statusInfo.label === 'Проверка отчета';
  
  // Отладка для проверки
  if (isAdminUser && isPendingStatus) {
    console.log('[TaskCard] Admin can approve:', {
      taskId: task.id,
      status: task.status,
      label: statusInfo.label,
      userRole: user?.role,
      isAdmin: isAdmin()
    });
  }

  return (
    <>
      <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-transparent dark:border-gray-700 hover:border-primary-100 dark:hover:border-primary-800 overflow-hidden flex flex-col h-full">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img 
            src={task.imageUrl} 
            alt={task.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
            }}
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} shadow-sm backdrop-blur-sm`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <div className="flex-1">
            <h3 
              className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer"
              onClick={() => setIsDetailsModalOpen(true)}
            >
              {task.title}
            </h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed">
              {task.description}
            </p>

            {task.report && (isAdmin() || task.createdBy === user?.id || task.assignedTo === user?.id) && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-700 mb-1">Отчет исполнителя:</p>
                <p className="text-gray-600 mb-2 italic">"{task.report.description}"</p>
                {task.report.imageUrl && (
                  <a 
                    href={task.report.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 text-xs font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Смотреть фото-доказательство
                  </a>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50 mt-4">
            <span className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {task.city}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {task.points} баллов
            </span>
          </div>

          <div className="mt-5 pt-0 space-y-2">
            {/* Кнопки админа для модерации - показываем ПЕРВЫМИ */}
            {/* Показываем кнопки если: админ И статус PENDING (или label "На проверке") */}
            {isAdminUser && (task.status === 'PENDING' || statusInfo.label === 'На проверке') ? (
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove();
                  }} 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  ✓ Одобрить
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject();
                  }} 
                  className="flex-1 bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  ✕ Отклонить
                </button>
              </div>
            ) : null}
            {isAdminUser && (task.status === 'REVIEW' || statusInfo.label === 'Проверка отчета') && (
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmCompletion();
                  }} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  ✓ Подтвердить
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectReport();
                  }} 
                  className="flex-1 bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  ✕ Отклонить отчет
                </button>
              </div>
            )}

            {/* Кнопка "Подробнее" для всех */}
            <button 
              onClick={() => setIsDetailsModalOpen(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Подробнее
            </button>

            {isUser() && task.status === 'OPEN' && task.createdBy !== user.id && !task.assignedTo && (
              <button onClick={handleTakeTask} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-medium shadow-primary/20 shadow-lg transition-all active:scale-[0.98]">
                Взять задание
              </button>
            )}
            {isUser() && task.status === 'OPEN' && task.assignedTo && task.assignedTo !== user.id && (
              <div className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-lg text-sm font-medium text-center">
                Задание уже взято
              </div>
            )}

            {isUser() && task.assignedTo === user.id && task.status === 'IN_PROGRESS' && (
              <div className="flex flex-col gap-2">
                <button onClick={onCompleteClick} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium shadow-violet/20 shadow-lg transition-all active:scale-[0.98]">
                  Завершить и отправить отчет
                </button>
                <button 
                  onClick={handleAbandonClick} 
                  disabled={loading}
                  className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Отказаться (Штраф -50%)
                </button>
              </div>
            )}

            {/* Кнопка чата - доступна создателю и волонтеру когда задание взято */}
            {isUser() && task.assignedTo && (task.createdBy === user.id || task.assignedTo === user.id) && (
              <Link
                to={`/chat/${task.id}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Чат
              </Link>
            )}
            
            {isUser() && task.createdBy === user.id && (
              <div className="text-xs text-center text-gray-400 mt-2 font-medium">
                Опубликовано {new Date(task.createdAt).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        </div>
      </div>

      <CompleteTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitReport}
        loading={loading}
      />

      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={task}
        user={user}
        isAdmin={isAdmin()}
      />
    </>
  );
};
