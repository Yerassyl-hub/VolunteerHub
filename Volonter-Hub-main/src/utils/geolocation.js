// Координаты центра Казахстана
export const BASE_COORDS = { lat: 48.0, lng: 66.0 };

// Функция перевода градусов в радианы
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Формула Haversine: Считает расстояние между двумя точками на карте (в км)
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Радиус Земли в км
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Дистанция в км
  
  return parseFloat(distance.toFixed(1)); // Округляем до 1 знака после запятой
}

// Получение геолокации пользователя (возвращает Promise)
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Геолокация недоступна, используем координаты по умолчанию", error);
          resolve(BASE_COORDS);
        }
      );
    } else {
      resolve(BASE_COORDS);
    }
  });
};

