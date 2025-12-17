import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPicker } from './MapPicker';
import { ImageUpload } from './ImageUpload';

export const CreateTaskForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [images, setImages] = useState([]);
  const [points, setPoints] = useState(50);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [address, setAddress] = useState(''); // Сохраняем адрес
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createTask } = useTasks();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!location) {
      setError('Пожалуйста, выберите местоположение задания');
      setLoading(false);
      return;
    }

    try {
      await createTask({
        title,
        description,
        city,
        phone,
        contactInfo,
        address: address || city, // Сохраняем адрес
        imageUrl: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400',
        images: images, // Сохраняем все фото
        points: parseInt(points),
        latitude: location.lat,
        longitude: location.lng
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ошибка создания задания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Создать заявку на помощь</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Заголовок *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
            placeholder="Например: Помощь в уборке квартиры"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Описание *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
            placeholder="Опишите, какая помощь вам нужна..."
          />
        </div>

        <div>
          <MapPicker 
            onLocationSelect={(coords) => {
              setLocation(coords);
            }}
            onAddressChange={(addressData) => {
              // Автоматически заполняем адрес и город
              if (addressData.address) {
                setAddress(addressData.address);
              }
              if (addressData.city && !city) {
                setCity(addressData.city);
              }
            }}
            initialLocation={location ? { lat: location.lat, lng: location.lng } : null}
            initialAddress={address}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Город *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              placeholder="Алматы"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Номер телефона *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              placeholder="+7 (999) 000-00-00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Дополнительные контакты (Telegram, WhatsApp)
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="@username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Фото задания *
          </label>
          <ImageUpload 
            onImagesChange={setImages}
            maxImages={5}
          />
          <p className="mt-2 text-xs text-gray-500">
            Загрузите фото задания (можно несколько, максимум 5)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Бонусы за выполнение *
          </label>
          <div className="mb-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Ваш баланс: <span className="font-bold text-blue-600">{user?.points || 0} очков</span>
            </p>
          </div>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min="1"
            max={user?.points || 1000}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 shadow-lg shadow-primary-500/30"
          >
            {loading ? 'Создание...' : 'Опубликовать задание'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};
