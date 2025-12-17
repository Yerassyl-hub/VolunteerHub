import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Search, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { BASE_COORDS } from '../utils/geolocation';

// ============================================
// ФУНКЦИИ ГЕОКОДИНГА (OpenStreetMap Nominatim) - только Казахстан
// ============================================

// Получение адреса по координатам (обратный геокодинг)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=kz`,
      {
        headers: {
          'User-Agent': 'VolunteerHub/1.0'
        }
      }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      const parts = [];
      if (addr.road) parts.push(addr.road);
      if (addr.house_number) parts.push(addr.house_number);
      if (parts.length === 0 && addr.house) parts.push(addr.house);
      
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const region = addr.state || addr.region || '';
      
      let address = parts.join(', ');
      if (city) address += (address ? ', ' : '') + city;
      if (region && region !== city) address += (address ? ', ' : '') + region;
      
      return {
        displayName: address || data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: city || '',
        address: address || data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
    }
    return {
      displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: '',
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: '',
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
  }
};

// Получение координат по адресу (геокодинг) - только Казахстан
const geocode = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=kz&limit=1`,
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
        address: kzResult.display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

export const MapPicker = ({ onLocationSelect, onAddressChange = null, initialLocation = null, initialAddress = null }) => {
  // Состояния
  const [coords, setCoords] = useState(initialLocation || BASE_COORDS);
  const [address, setAddress] = useState(initialAddress || '');
  const [city, setCity] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [zoom, setZoom] = useState(13); // Начальный зум (13 = город)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapKey, setMapKey] = useState(0);
  
  // Refs
  const mapContainerRef = useRef(null);
  const addressInputRef = useRef(null);
  const coordsRef = useRef(coords);

  // Синхронизируем ref с состоянием
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Отслеживаем, выбрал ли пользователь местоположение вручную
  const [hasUserSelected, setHasUserSelected] = useState(false);
  
  // Загружаем адрес при изменении координат только если пользователь выбрал местоположение
  useEffect(() => {
    if (coords && hasUserSelected) {
      setIsLoadingAddress(true);
      reverseGeocode(coords.lat, coords.lng).then(result => {
        setAddress(result.displayName);
        setCity(result.city);
        setIsLoadingAddress(false);
        
        // Передаем адрес в родительский компонент
        if (onAddressChange) {
          onAddressChange({
            address: result.displayName,
            city: result.city
          });
        }
      });
    }
  }, [coords, hasUserSelected, onAddressChange]);

  // Инициализация при монтировании
  useEffect(() => {
    if (initialLocation) {
      setCoords(initialLocation);
      coordsRef.current = initialLocation;
      setZoom(15); // Детальный вид для выбранного места
      // Загружаем адрес для начального местоположения
      reverseGeocode(initialLocation.lat, initialLocation.lng).then(result => {
        setAddress(result.displayName);
        setCity(result.city);
        if (onAddressChange) {
          onAddressChange({
            address: result.displayName,
            city: result.city
          });
        }
      });
    } else if (initialAddress) {
      setAddress(initialAddress);
      handleAddressSearch(initialAddress);
    } else {
      // Используем базовые координаты Казахстана без автоматического определения геолокации
      reverseGeocode(BASE_COORDS.lat, BASE_COORDS.lng).then(result => {
        setAddress(result.displayName);
        setCity(result.city);
      });
      // НЕ вызываем onLocationSelect автоматически - пользователь должен выбрать сам
      if (onLocationSelect) {
        onLocationSelect({ lat: BASE_COORDS.lat, lng: BASE_COORDS.lng });
      }
    }
  }, []);

  // ============================================
  // РАСЧЕТ КООРДИНАТ ПРИ КЛИКЕ
  // ============================================
  
  const calculateCoordsFromClick = useCallback((x, y, rect) => {
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Формула для расчета метров на пиксель в зависимости от зума
    const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
    const latOffset = -(deltaY * metersPerPixel) / 111320;
    const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
    
    return {
      lat: coordsRef.current.lat + latOffset,
      lng: coordsRef.current.lng + lngOffset
    };
  }, [zoom]);

  // ============================================
  // ОБРАБОТЧИКИ СОБЫТИЙ
  // ============================================

  const handleMapClick = async (e) => {
    if (!isSelecting || !mapContainerRef.current) return;
    
    const target = e.target;
    const clickedButton = target.closest('button');
    const clickedInteractive = target.closest('[style*="z-index: 30"]');
    
    if (clickedButton || clickedInteractive) {
      return;
    }
    
    // Отмечаем, что пользователь выбрал местоположение вручную
    setHasUserSelected(true);
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newCoords = calculateCoordsFromClick(x, y, rect);
    
    setCoords(newCoords);
    coordsRef.current = newCoords;
    setZoom(15); // Детальный вид улиц
    setMapKey(prev => prev + 1);
    
    // Отмечаем, что пользователь выбрал местоположение
    setHasUserSelected(true);
    
    setIsLoadingAddress(true);
    const result = await reverseGeocode(newCoords.lat, newCoords.lng);
    setAddress(result.displayName);
    setCity(result.city);
    setIsLoadingAddress(false);
    
    if (onLocationSelect) {
      onLocationSelect({ lat: newCoords.lat, lng: newCoords.lng });
    }
    if (onAddressChange) {
      onAddressChange({
        address: result.displayName,
        city: result.city
      });
    }
    setIsSelecting(false);
  };

  const handleZoomIn = () => {
    if (zoom < 18) {
      setZoom(prev => prev + 1);
      setMapKey(prev => prev + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 4) {
      setZoom(prev => prev - 1);
      setMapKey(prev => prev + 1);
    }
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [zoom]);

  const moveMap = useCallback((direction) => {
    if (!mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const moveDistance = 0.3;
    
    let deltaX = 0;
    let deltaY = 0;
    
    switch(direction) {
      case 'up': deltaY = -rect.height * moveDistance; break;
      case 'down': deltaY = rect.height * moveDistance; break;
      case 'left': deltaX = -rect.width * moveDistance; break;
      case 'right': deltaX = rect.width * moveDistance; break;
    }
    
    const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
    const latOffset = -(deltaY * metersPerPixel) / 111320;
    const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
    
    const newCoords = {
      lat: coordsRef.current.lat + latOffset,
      lng: coordsRef.current.lng + lngOffset
    };
    
    setCoords(newCoords);
    coordsRef.current = newCoords;
    setMapKey(prev => prev + 1);
    
    // Отмечаем, что пользователь выбрал местоположение
    setHasUserSelected(true);
    
    setIsLoadingAddress(true);
    reverseGeocode(newCoords.lat, newCoords.lng).then(result => {
      setAddress(result.displayName);
      setCity(result.city);
      setIsLoadingAddress(false);
      if (onLocationSelect) {
        onLocationSelect({ lat: newCoords.lat, lng: newCoords.lng });
      }
      if (onAddressChange) {
        onAddressChange({
          address: result.displayName,
          city: result.city
        });
      }
    });
  }, [zoom, onLocationSelect, onAddressChange]);

  const handleMouseDown = (e) => {
    if (!isSelecting && e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && !isSelecting && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
      const latOffset = -(deltaY * metersPerPixel) / 111320;
      const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
      
      const newCoords = {
        lat: coordsRef.current.lat + latOffset,
        lng: coordsRef.current.lng + lngOffset
      };
      
      setCoords(newCoords);
      coordsRef.current = newCoords;
      setMapKey(prev => prev + 1);
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isSelecting, dragStart, zoom]);

  const handleMouseUp = useCallback(async () => {
    if (isDragging) {
      setIsDragging(false);
      // Отмечаем, что пользователь выбрал местоположение
      setHasUserSelected(true);
      
      setIsLoadingAddress(true);
      const result = await reverseGeocode(coordsRef.current.lat, coordsRef.current.lng);
      setAddress(result.displayName);
      setCity(result.city);
      setIsLoadingAddress(false);
      if (onLocationSelect) {
        onLocationSelect({ lat: coordsRef.current.lat, lng: coordsRef.current.lng });
      }
      if (onAddressChange) {
        onAddressChange({
          address: result.displayName,
          city: result.city
        });
      }
    }
  }, [isDragging, onLocationSelect, onAddressChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      mapContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        mapContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  const handleAddressSearch = async (searchAddress) => {
    if (!searchAddress || searchAddress.trim() === '') return;
    
    setIsSearching(true);
    const result = await geocode(searchAddress);
    
    if (result) {
      setCoords({ lat: result.lat, lng: result.lng });
      coordsRef.current = { lat: result.lat, lng: result.lng };
      setAddress(result.address);
      if (zoom < 13) {
        setZoom(13);
      }
      setMapKey(prev => prev + 1);
      
      // Отмечаем, что пользователь выбрал местоположение через поиск
      setHasUserSelected(true);
      
      if (onLocationSelect) {
        onLocationSelect({ lat: result.lat, lng: result.lng });
      }
      
      // Получаем детали адреса для извлечения города
      const addressResult = await reverseGeocode(result.lat, result.lng);
      setCity(addressResult.city);
      if (onAddressChange) {
        onAddressChange({
          address: result.address,
          city: addressResult.city
        });
      }
    } else {
      alert('Адрес не найден. Попробуйте ввести более точный адрес.');
    }
    setIsSearching(false);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const searchAddress = addressInputRef.current?.value || address;
    if (searchAddress) {
      await handleAddressSearch(searchAddress);
    }
  };

  const useCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoords(newCoords);
          coordsRef.current = newCoords;
          setZoom(15); // Детальный вид улиц
          setMapKey(prev => prev + 1);
          
          // Отмечаем, что пользователь выбрал местоположение через кнопку "Мое место"
          setHasUserSelected(true);
          
          setIsLoadingAddress(true);
          const result = await reverseGeocode(newCoords.lat, newCoords.lng);
          setAddress(result.displayName);
          setCity(result.city);
          setIsLoadingAddress(false);
          if (onLocationSelect) {
            onLocationSelect({ lat: newCoords.lat, lng: newCoords.lng });
          }
          if (onAddressChange) {
            onAddressChange({
              address: result.displayName,
              city: result.city
            });
          }
        },
        () => alert('Не удалось получить ваше местоположение')
      );
    }
  };

  const showAllCountry = async () => {
    const countryCenter = BASE_COORDS;
    setCoords(countryCenter);
    coordsRef.current = countryCenter;
    setZoom(5);
    setMapKey(prev => prev + 1);
    setIsLoadingAddress(true);
    const result = await reverseGeocode(countryCenter.lat, countryCenter.lng);
    setAddress(result.displayName);
    setCity(result.city);
    setIsLoadingAddress(false);
    if (onLocationSelect) {
      onLocationSelect({ lat: countryCenter.lat, lng: countryCenter.lng });
    }
    if (onAddressChange) {
      onAddressChange({
        address: result.displayName,
        city: result.city
      });
    }
  };

  // ============================================
  // ГЕНЕРАЦИЯ URL ДЛЯ КАРТЫ
  // ============================================

  const getBbox = () => {
    // Границы Казахстана
    if (zoom <= 5) {
      return '46.0,40.0,88.0,55.0';
    }
    const latRange = 360 / Math.pow(2, zoom + 8);
    const lngRange = latRange / Math.cos(coords.lat * Math.PI / 180);
    return `${coords.lng - lngRange},${coords.lat - latRange},${coords.lng + lngRange},${coords.lat + latRange}`;
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${getBbox()}&layer=mapnik&marker=${coords.lat},${coords.lng}`;

  // ============================================
  // РЕНДЕР
  // ============================================

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-bold text-sm block text-gray-700 dark:text-gray-300">Местоположение задания *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsSelecting(!isSelecting)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isSelecting
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isSelecting ? 'Отменить' : 'Выбрать на карте'}
          </button>
          <button
            type="button"
            onClick={showAllCountry}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Вся страна
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            <Navigation size={12} />
            Мое место
          </button>
        </div>
      </div>
      
      {isSelecting && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg text-xs">
          <strong>Режим выбора:</strong> Кликните на карте ниже, чтобы установить адрес
        </div>
      )}

      {/* Поле ввода адреса */}
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 block font-medium">Адрес</label>
        <form onSubmit={handleAddressSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={16} />
            <input
              ref={addressInputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => {
                if (address && address.trim() !== '') {
                  handleAddressSearch(address);
                }
              }}
              placeholder="Введите адрес (например: Алматы, Абая 10)"
              className="w-full border-2 border-gray-200 dark:border-gray-600 pl-10 pr-3 py-2.5 rounded-lg text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {isLoadingAddress && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400"></div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddressSubmit}
            disabled={isSearching || isLoadingAddress}
            className="px-4 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSearching ? '...' : 'Найти'}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          Введите адрес или выберите точку на карте. Используйте колесико мыши для зума.
        </p>
      </div>

      {/* Интерактивная карта */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        className={`w-full h-80 rounded-lg overflow-hidden border-2 relative ${
          isSelecting 
            ? 'border-primary-600 dark:border-primary-400 cursor-crosshair' 
            : isDragging
            ? 'border-primary-600 dark:border-primary-400 cursor-grabbing'
            : 'border-gray-200 dark:border-gray-700 cursor-grab'
        }`}
      >
        <iframe
          key={`${mapKey}-${zoom}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapUrl}
          className={isSelecting ? 'pointer-events-none opacity-50' : 'pointer-events-none'}
          title="Карта выбора местоположения"
        ></iframe>
        
        {/* Интерактивный маркер в центре */}
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${
            isSelecting ? 'animate-pulse' : ''
          }`}
          style={{ pointerEvents: 'none' }}
        >
          <MapPin 
            className="text-primary-600 dark:text-primary-400 drop-shadow-lg" 
            size={36} 
            fill="currentColor" 
          />
        </div>

        {/* Кнопки управления зумом */}
        <div 
          className="absolute top-3 right-3 flex flex-col gap-2"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 18}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50"
            title="Увеличить"
          >
            <ZoomIn size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 4}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50"
            title="Уменьшить"
          >
            <ZoomOut size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Кнопки навигации */}
        <div 
          className="absolute top-3 left-3 flex flex-col gap-1"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => moveMap('up')}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 shadow-lg transition-colors"
            title="Вверх"
          >
            <ArrowUp size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => moveMap('left')}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 shadow-lg transition-colors"
              title="Влево"
            >
              <ArrowLeft size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => moveMap('right')}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 shadow-lg transition-colors"
              title="Вправо"
            >
              <ArrowRight size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => moveMap('down')}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 shadow-lg transition-colors"
            title="Вниз"
          >
            <ArrowDown size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Индикатор уровня зума и координат */}
        <div 
          className="absolute bottom-3 right-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-lg space-y-1"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>Масштаб: {zoom}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </div>
        </div>

        {/* Overlay для кликов в режиме выбора */}
        {isSelecting && (
          <div 
            className="absolute inset-0 bg-transparent cursor-crosshair"
            onClick={handleMapClick}
            onMouseDown={(e) => {
              if (isSelecting) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            style={{ 
              pointerEvents: 'auto',
              zIndex: 25
            }}
          ></div>
        )}
      </div>

      {/* Информация о выбранном адресе */}
      {address && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <strong className="block mb-1">Выбранный адрес:</strong>
              <p className="font-medium">{address}</p>
              {city && (
                <p className="text-xs mt-1 opacity-80">Город: {city}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

