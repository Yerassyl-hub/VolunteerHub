import React from 'react';

export const MapView = ({ userLocation, tasks, cityCoordinates }) => {
  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Определение местоположения...
      </div>
    );
  }

  // Вычисляем центр и зум для карты
  let bbox, markers;
  
  if (tasks && tasks.length > 0) {
    // Создаем bbox для всех заданий + местоположение пользователя
    const allLats = [userLocation.lat, ...tasks.map(t => {
      if (t.latitude && t.longitude) return parseFloat(t.latitude);
      if (t.coordinates?.lat) return parseFloat(t.coordinates.lat);
      if (t.city && cityCoordinates) {
        const cityCoords = cityCoordinates[t.city] || cityCoordinates['Алматы'];
        return cityCoords.lat;
      }
      return userLocation.lat;
    })];
    const allLngs = [userLocation.lng, ...tasks.map(t => {
      if (t.latitude && t.longitude) return parseFloat(t.longitude);
      if (t.coordinates?.lng) return parseFloat(t.coordinates.lng);
      if (t.city && cityCoordinates) {
        const cityCoords = cityCoordinates[t.city] || cityCoordinates['Алматы'];
        return cityCoords.lng;
      }
      return userLocation.lng;
    })];
    
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);
    
    // Вычисляем padding на основе расстояния между точками
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let padding;
    if (maxDiff < 0.01) padding = 0.002; // Очень близко - детальный вид
    else if (maxDiff < 0.05) padding = 0.005;
    else if (maxDiff < 0.1) padding = 0.01;
    else padding = 0.02;
    
    bbox = `${minLng - padding},${minLat - padding},${maxLng + padding},${maxLat + padding}`;
    
    // Создаем маркеры для карты
    // В OpenStreetMap первый маркер синий, остальные красные
    // Пользователь должен быть красным, задания синими
    // Поэтому сначала задания, потом пользователь
    const taskMarkers = tasks.map(t => {
      let taskCoords = null;
      if (t.latitude && t.longitude) {
        taskCoords = { lat: parseFloat(t.latitude), lng: parseFloat(t.longitude) };
      } else if (t.coordinates && t.coordinates.lat && t.coordinates.lng) {
        taskCoords = { lat: parseFloat(t.coordinates.lat), lng: parseFloat(t.coordinates.lng) };
      } else if (t.city && cityCoordinates) {
        taskCoords = cityCoordinates[t.city] || cityCoordinates['Алматы'];
      }
      return taskCoords ? `${taskCoords.lat},${taskCoords.lng}` : null;
    }).filter(m => m !== null);
    
    // Формируем массив маркеров: сначала задания (синие), потом пользователь (красный)
    markers = [
      ...taskMarkers, // Задания (синие - первые)
      `${userLocation.lat},${userLocation.lng}` // Пользователь (красный - последний)
    ];
    
    // Убеждаемся что есть хотя бы один маркер
    if (markers.length === 0) {
      markers = [`${userLocation.lat},${userLocation.lng}`];
    }
  } else {
    // Фокусируемся на пользователе с очень близким зумом (видны улицы)
    const padding = 0.001; // Очень маленький padding для детального вида улиц
    bbox = `${userLocation.lng - padding},${userLocation.lat - padding},${userLocation.lng + padding},${userLocation.lat + padding}`;
    markers = [`${userLocation.lat},${userLocation.lng}`];
  }
  
  // Формируем URL для карты с маркерами
  // В OpenStreetMap embed формат: marker=lat,lng для каждого маркера
  // Первый маркер синий, остальные красные
  // Важно: маркеры должны быть в формате lat,lng (не lng,lat!)
  const markerParams = markers.length > 0 
    ? markers.map(m => `marker=${m}`).join('&')
    : '';
  
  // Добавляем зум для более детального отображения
  const zoom = tasks && tasks.length > 0 ? 15 : 18; // Ближе к улицам когда только пользователь
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${markerParams ? '&' + markerParams : ''}`;
  
  return (
    <iframe
      width="100%"
      height="100%"
      frameBorder="0"
      scrolling="no"
      marginHeight="0"
      marginWidth="0"
      src={mapUrl}
      style={{ border: 'none' }}
      title="Карта заданий"
    ></iframe>
  );
};

export default MapView;
