# Документация логики карты для VolunteerHub

## Общее описание

Приложение использует интерактивную карту на основе OpenStreetMap для выбора местоположения заданий и расчета расстояний между пользователями и заданиями. Вся логика работает через бесплатные API OpenStreetMap (Nominatim) без необходимости API ключей.

---

## 1. Геокодинг (Адрес → Координаты)

### Назначение
Преобразование текстового адреса в географические координаты (широта, долгота).

### API
**Nominatim OpenStreetMap** - бесплатный сервис геокодинга
- URL: `https://nominatim.openstreetmap.org/search`
- Метод: GET
- Параметры:
  - `q` - адрес для поиска
  - `format=json` - формат ответа
  - `limit=1` - количество результатов

### Пример запроса
```
GET https://nominatim.openstreetmap.org/search?format=json&q=Алматы,+Казахстан&limit=1
Headers: User-Agent: VolunteerHub/1.0
```

### Ответ
```json
[{
  "lat": "43.2220",
  "lon": "76.8512",
  "display_name": "Алматы, Казахстан"
}]
```

### Использование в коде
```javascript
const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    { headers: { 'User-Agent': 'VolunteerHub/1.0' } }
  );
  const data = await response.json();
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name
  };
};
```

---

## 2. Обратный геокодинг (Координаты → Адрес)

### Назначение
Преобразование координат в текстовый адрес с деталями (город, улица и т.д.).

### API
**Nominatim Reverse Geocoding**
- URL: `https://nominatim.openstreetmap.org/reverse`
- Метод: GET
- Параметры:
  - `lat` - широта
  - `lon` - долгота
  - `format=json` - формат ответа
  - `addressdetails=1` - включить детали адреса

### Пример запроса
```
GET https://nominatim.openstreetmap.org/reverse?format=json&lat=43.2220&lon=76.8512&addressdetails=1
Headers: User-Agent: VolunteerHub/1.0
```

### Ответ
```json
{
  "display_name": "Алматы, Казахстан",
  "address": {
    "city": "Алматы",
    "country": "Казахстан"
  }
}
```

### Использование в коде
```javascript
const reverseGeocode = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { 'User-Agent': 'VolunteerHub/1.0' } }
  );
  const data = await response.json();
  return {
    displayName: data.display_name,
    city: data.address?.city || data.address?.town || ''
  };
};
```

---

## 3. Интерактивная карта (Leaflet)

### Библиотека
**Leaflet** - открытая библиотека для интерактивных карт
- Установка: `npm install leaflet react-leaflet --legacy-peer-deps`
- Импорт: `import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'`

### Компоненты

#### MapContainer
Основной контейнер карты
```jsx
<MapContainer
  center={[43.2220, 76.8512]}  // Центр карты [lat, lng]
  zoom={15}                      // Уровень приближения (15 = видны улицы)
  style={{ height: '400px', width: '100%' }}
  scrollWheelZoom={true}         // Зум колесиком мыши
>
```

#### TileLayer
Слой карты OpenStreetMap
```jsx
<TileLayer
  attribution='&copy; OpenStreetMap contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

#### Marker
Маркер на карте
```jsx
<Marker position={[43.2220, 76.8512]} />
```

#### Обработка кликов
```jsx
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}
```

---

## 4. Выбор местоположения кликом на карте

### Логика работы

1. **Пользователь кликает на карте**
   - Событие `click` в `useMapEvents`
   - Получаем координаты: `e.latlng.lat`, `e.latlng.lng`

2. **Обратный геокодинг**
   - Вызываем `reverseGeocode(lat, lng)`
   - Получаем адрес и город

3. **Обновление состояния**
   - Сохраняем координаты: `setCoordinates([lat, lng])`
   - Обновляем адрес: `setAddress(displayName)`
   - Заполняем город: `setCity(city)`

4. **Обновление маркера**
   - Маркер автоматически перемещается на новую позицию
   - Карта центрируется на новом месте

### Код
```javascript
const handleMapClick = async (lat, lng) => {
  setIsSearching(true);
  setCoordinates([lat, lng]);
  setMapCenter([lat, lng]);
  
  // Обратный геокодинг
  const addressData = await reverseGeocode(lat, lng);
  if (addressData) {
    setAddress(addressData.displayName);
    if (onAddressChange) {
      onAddressChange({
        address: addressData.displayName,
        city: addressData.city
      });
    }
  }
  
  onLocationSelect({ lat, lng });
  setIsSearching(false);
};
```

---

## 5. Определение местоположения пользователя

### Браузерный API
**Geolocation API** - встроенный API браузера

### Использование
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    // Используем координаты
  },
  (error) => {
    // Обработка ошибки
  }
);
```

### Логика
1. Запрашиваем разрешение на геолокацию
2. Получаем координаты пользователя
3. Вызываем `handleMapClick(lat, lng)` для обработки
4. Автоматически заполняем адрес через обратный геокодинг

---

## 6. Расчет расстояния между точками

### Формула
**Формула гаверсинуса** - расчет расстояния на сфере

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Расстояние в километрах
}
```

### Использование
```javascript
const distance = calculateDistance(
  userLocation.lat,
  userLocation.lng,
  task.latitude,
  task.longitude
);
```

---

## 7. Сортировка заданий

### Варианты сортировки

#### По близости
```javascript
tasks.sort((a, b) => a.distance - b.distance);
```

#### По бонусам
```javascript
tasks.sort((a, b) => (b.points || 0) - (a.points || 0));
```

#### По новизне
```javascript
tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
```

### Реализация
```javascript
const availableTasks = useMemo(() => {
  const tasksWithDistance = availableTasksRaw.map(task => {
    const taskCoords = task.latitude && task.longitude
      ? { lat: task.latitude, lng: task.longitude }
      : cityCoordinates[task.city] || cityCoordinates['Алматы'];
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      taskCoords.lat,
      taskCoords.lng
    );
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
```

---

## 8. Отображение карты на дашборде

### Логика отображения

1. **Если есть задания:**
   - Создаем bbox (границы) для всех точек
   - Добавляем padding для видимости
   - Показываем все задания + местоположение пользователя

2. **Если заданий нет:**
   - Фокусируемся на пользователе
   - Используем маленький padding (0.001) для детального вида улиц

### Код
```javascript
if (availableTasks.length > 0) {
  const allLats = [userLocation.lat, ...availableTasks.map(t => t.coordinates?.lat)];
  const allLngs = [userLocation.lng, ...availableTasks.map(t => t.coordinates?.lng)];
  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLng = Math.min(...allLngs);
  const maxLng = Math.max(...allLngs);
  const padding = Math.max(0.001, Math.min(0.01, Math.max(latDiff, lngDiff) * 0.3));
  bbox = `${minLng - padding},${minLat - padding},${maxLng + padding},${maxLat + padding}`;
} else {
  const padding = 0.001; // Детальный вид улиц
  bbox = `${userLocation.lng - padding},${userLocation.lat - padding},${userLocation.lng + padding},${userLocation.lat + padding}`;
}
```

---

## 9. Сохранение координат в задании

### Структура данных
```javascript
const task = {
  id: '1',
  title: 'Помощь в уборке',
  city: 'Алматы',
  latitude: 43.2220,    // Широта
  longitude: 76.8512,   // Долгота
  // ... другие поля
};
```

### При создании задания
```javascript
await createTask({
  title,
  description,
  city,
  latitude: location.lat,
  longitude: location.lng,
  // ... другие поля
});
```

---

## 10. Координаты городов Казахстана (Fallback)

Если у задания нет координат, используются координаты города:

```javascript
const cityCoordinates = {
  'Алматы': { lat: 43.2220, lng: 76.8512 },
  'Астана': { lat: 51.1694, lng: 71.4491 },
  'Шымкент': { lat: 42.3419, lng: 69.5901 },
  'Актобе': { lat: 50.2833, lng: 57.1667 },
  'Караганда': { lat: 49.8014, lng: 73.1059 },
  // ... другие города
};
```

---

## 11. Автозаполнение адреса при выборе

### Логика
1. Пользователь кликает на карте
2. Получаем координаты
3. Вызываем обратный геокодинг
4. Извлекаем город из `address.city` или `address.town`
5. Автоматически заполняем поле "Город"

### Код
```javascript
onAddressChange={(addressData) => {
  if (addressData.city && !city) {
    setCity(addressData.city);
  }
}}
```

---

## 12. Важные моменты

### User-Agent заголовок
Nominatim требует указания User-Agent:
```javascript
headers: {
  'User-Agent': 'VolunteerHub/1.0'
}
```

### Rate Limiting
Nominatim имеет ограничения:
- 1 запрос в секунду
- Рекомендуется кэширование результатов

### Фикс иконок Leaflet
```javascript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
```

---

## 13. Полный пример использования

```javascript
// 1. Пользователь вводит адрес
const address = "Алматы, проспект Абая";

// 2. Геокодинг
const coords = await geocodeAddress(address);
// { lat: 43.2220, lng: 76.8512, displayName: "..." }

// 3. Сохранение в задании
const task = {
  title: "Помощь",
  latitude: coords.lat,
  longitude: coords.lng
};

// 4. Пользователь видит задание на карте
// 5. Расчет расстояния
const distance = calculateDistance(
  userLocation.lat, userLocation.lng,
  task.latitude, task.longitude
);

// 6. Сортировка по близости
tasks.sort((a, b) => a.distance - b.distance);
```

---

## Итоговая логика работы

1. **Создание задания:**
   - Пользователь вводит адрес ИЛИ кликает на карте
   - Геокодинг/обратный геокодинг → координаты
   - Сохранение координат в задании

2. **Просмотр заданий:**
   - Определение местоположения пользователя
   - Расчет расстояний до всех заданий
   - Сортировка по выбранному критерию
   - Отображение на карте

3. **Выбор ближайшего:**
   - Сортировка по расстоянию
   - Отображение расстояния на карточке
   - Карта показывает все задания с маркерами

---

## Технологии

- **Leaflet** - интерактивные карты
- **OpenStreetMap** - картографические данные
- **Nominatim** - геокодинг API
- **Geolocation API** - определение местоположения браузера
- **Формула гаверсинуса** - расчет расстояний

---

## Промпт для разработчика

"Создай систему карт для приложения волонтерской помощи с использованием OpenStreetMap и Leaflet. Реализуй:

1. Интерактивную карту с возможностью клика для выбора местоположения
2. Геокодинг адресов через Nominatim API
3. Обратный геокодинг координат в адреса
4. Автоматическое заполнение города при выборе места
5. Определение местоположения пользователя через Geolocation API
6. Расчет расстояний между точками по формуле гаверсинуса
7. Сортировку заданий по близости, бонусам и новизне
8. Отображение всех заданий на карте с маркерами
9. Детальный зум карты при определении местоположения (видны улицы)
10. Сохранение координат (latitude, longitude) в каждом задании

Используй бесплатные API без ключей. Все должно работать для Казахстана с координатами городов как fallback."

