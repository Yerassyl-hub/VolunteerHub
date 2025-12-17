import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockApi';

export default function Profile() {
  const { user, updateUser: updateUserInContext } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactInfo: ''
  });

  // Обновляем formData когда user загружается
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        contactInfo: user.contactInfo || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (updateUserInContext) {
        await updateUserInContext(user.id, formData);
      } else {
        await mockApi.updateUser(user.id, formData);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Профиль</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Редактировать
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Имя *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+7 (999) 000-00-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Дополнительные контакты (Telegram, WhatsApp)
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="@username"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    contactInfo: user?.contactInfo || ''
                  });
                  setError('');
                }}
                className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.name?.[0] || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Роль</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {user.role === 'ADMIN' ? 'Администратор' : 'Волонтер'}
                </div>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                <div className="text-sm text-primary-600 dark:text-primary-400 mb-1">Баллы</div>
                <div className="font-bold text-primary-700 dark:text-primary-300 text-2xl">
                  {user.points || 0}
                </div>
              </div>

              {user.phone && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Телефон</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{user.phone}</div>
                </div>
              )}

              {user.contactInfo && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Контакты</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{user.contactInfo}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

