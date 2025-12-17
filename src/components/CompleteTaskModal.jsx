import React, { useState } from 'react';

export const CompleteTaskModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ description, imageUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Отчет о выполнении</h3>
          <p className="text-sm text-gray-500 mb-6">
            Прикрепите доказательства выполнения задания, чтобы администратор мог начислить вам баллы.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Комментарий к отчету *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none text-gray-800 h-24 resize-none"
                placeholder="Опишите, что было сделано..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ссылка на фото-доказательство *
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none text-gray-800"
                placeholder="https://..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">Вставьте ссылку на изображение (например, с Imgur или Google Drive)</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/20 transition-colors disabled:opacity-70"
              >
                {loading ? 'Отправка...' : 'Отправить отчет'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
