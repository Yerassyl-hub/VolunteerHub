import React, { useState, useEffect } from 'react';

// Геокодинг через Nominatim (OpenStreetMap) - только Казахстан
const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=kz&limit=5`,
      {
        headers: {
          'User-Agent': 'VolunteerHub/1.0'
        }
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      // Ищем результат из Казахстана
      const kzResult = data.find(item => 
        item.display_name.toLowerCase().includes('казахстан') ||
        item.display_name.toLowerCase().includes('kazakhstan') ||
        item.address?.country_code === 'kz'
      ) || data[0];
      
      return {
        lat: parseFloat(kzResult.lat),
        lng: parseFloat(kzResult.lon),
        displayName: kzResult.display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Обратный геокодинг (координаты -> адрес) - только Казахстан
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=kz`,
      {
        headers: {
          'User-Agent': 'VolunteerHub/1.0'
        }
      }
    );
    const data = await response.json();
    if (data && data.display_name) {
      return {
        displayName: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || '',
        address: data.display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};


export const LocationPicker = ({ onLocationSelect, initialLocation = null, onAddressChange = null }) => {
  const [address, setAddress] = useState('');
  // Преобразуем initialLocation в формат [lat, lng] если он есть
  const getInitialCoords = () => {
    if (initialLocation) {
      if (Array.isArray(initialLocation)) {
        return initialLocation;
      } else if (initialLocation.lat && initialLocation.lng) {
        return [initialLocation.lat, initialLocation.lng];
      }
    }
    return [43.2220, 76.8512]; // Алматы по умолчанию
  };
  
  const [coordinates, setCoordinates] = useState(getInitialCoords());
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mapCenter, setMapCenter] = useState(getInitialCoords());

  // Обработка выбора координат (через поиск или геолокацию)
  const handleLocationSelect = async (lat, lng) => {
    setIsSearching(true);
    const coords = { lat, lng };
    setCoordinates([lat, lng]);
    setMapCenter([lat, lng]);
    
    // Обратный геокодинг для получения адреса
    const addressData = await reverseGeocode(lat, lng);
    if (addressData) {
      setAddress(addressData.displayName);
      // Передаем адрес и город в родительский компонент
      if (onAddressChange) {
        onAddressChange({
          address: addressData.displayName,
          city: addressData.city
        });
      }
    }
    
    onLocationSelect(coords);
    setIsSearching(false);
  };

  // Определение текущего местоположения
  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          await handleLocationSelect(lat, lng);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Не удалось определить ваше местоположение. Пожалуйста, введите адрес вручную или выберите на карте.');
          setIsSearching(false);
        }
      );
    } else {
      alert('Геолокация не поддерживается вашим браузером');
    }
  };

  // Поиск адреса
  const handleSearchAddress = async () => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    const result = await geocodeAddress(address);
    if (result) {
      await handleLocationSelect(result.lat, result.lng);
      setAddress(result.displayName);
    } else {
      alert('Адрес не найден. Попробуйте ввести более точный адрес.');
      setIsSearching(false);
    }
  };

  // Автопоиск при вводе
  useEffect(() => {
    if (address.length > 3) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=kz&limit=5`,
            {
              headers: {
                'User-Agent': 'VolunteerHub/1.0'
              }
            }
          );
          const data = await response.json();
          setSuggestions(data.map(item => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          })));
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [address]);

  const handleSelectSuggestion = async (suggestion) => {
    setAddress(suggestion.displayName);
    await handleLocationSelect(suggestion.lat, suggestion.lng);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Местоположение задания *
        </label>
        
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Введите адрес или кликните на карте"
            required
          />
          <button
            type="button"
            onClick={handleSearchAddress}
            disabled={isSearching || !address.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {isSearching ? 'Поиск...' : 'Найти'}
          </button>
          <button
            type="button"
            onClick={handleGetMyLocation}
            disabled={isSearching}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
            title="Определить мое местоположение"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Мое местоположение
          </button>
        </div>

        {/* Подсказки адресов */}
        {suggestions.length > 0 && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-50 relative">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
              >
                {suggestion.displayName}
              </button>
            ))}
          </div>
        )}

        {coordinates && (
          <div className="mt-2 text-xs text-gray-500">
            Координаты: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
            <span className="ml-2 text-primary-600">• Кликните на карте для выбора места</span>
          </div>
        )}
      </div>

      {/* Карта OpenStreetMap */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
          {coordinates && coordinates.length === 2 ? (
            <>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates[1] - 0.002},${coordinates[0] - 0.002},${coordinates[1] + 0.002},${coordinates[0] + 0.002}&layer=mapnik&marker=${coordinates[0]},${coordinates[1]}`}
                style={{ border: 'none' }}
                title="Выбор местоположения"
              ></iframe>
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs shadow-md">
                <p className="text-gray-600 mb-1">Для выбора места:</p>
                <p className="text-gray-500">1. Введите адрес выше</p>
                <p className="text-gray-500">2. Или нажмите "Мое местоположение"</p>
                <p className="text-gray-500">3. Или откройте карту в новом окне</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Введите адрес или определите местоположение
            </div>
          )}
        </div>
        {coordinates && coordinates.length === 2 && (
          <div className="p-2 bg-gray-50 text-xs text-center text-gray-600">
            <a
              href={`https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Открыть карту в новом окне для точного выбора места
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
