const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEYS = {
  USERS: 'volunteer_platform_users',
  TASKS: 'volunteer_platform_tasks',
  INITIALIZED: 'volunteer_platform_initialized',
  CHAT_MESSAGES: 'volunteer_platform_chat_messages'
};

// Координаты городов Казахстана
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

const seedData = () => {
  const defaultUsers = [
    {
      id: '1',
      login: 'admin',
      password: 'admin',
      role: 'ADMIN',
      name: 'Администратор',
      email: 'admin@platform.ru'
    },
    {
      id: '2',
      login: 'user1',
      password: '123',
      role: 'USER',
      name: 'Иван Петров',
      email: 'user1@platform.ru',
      points: 200
    },
    {
      id: '3',
      login: 'user2',
      password: '123',
      role: 'USER',
      name: 'Мария Иванова',
      email: 'user2@platform.ru',
      points: 200
    }
  ];

  const defaultTasks = [
    {
      id: '1',
      title: 'Помощь в уборке квартиры',
      description: 'Нужна помощь в уборке квартиры пожилой женщине. Требуется помощь с генеральной уборкой.',
      city: 'Алматы',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
      status: 'OPEN',
      createdBy: '3',
      assignedTo: null,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      points: 50,
      latitude: 43.2220,
      longitude: 76.8512
    },
    {
      id: '2',
      title: 'Доставка продуктов',
      description: 'Нужна помощь с доставкой продуктов из магазина. Живу на 3 этаже, лифт не работает.',
      city: 'Астана',
      imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400',
      status: 'PENDING',
      createdBy: '3',
      assignedTo: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      points: 30,
      latitude: 51.1694,
      longitude: 71.4491
    },
    {
      id: '3',
      title: 'Помощь в ремонте',
      description: 'Требуется помощь с мелким ремонтом в квартире. Нужно повесить полки и починить кран.',
      city: 'Шымкент',
      imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
      status: 'DONE',
      createdBy: '3',
      assignedTo: '2',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      points: 75,
      latitude: 42.3419,
      longitude: 69.5901
    },
    {
      id: '4',
      title: 'Прогулка с собакой',
      description: 'Нужна помощь с выгулом собаки. Не могу выйти из дома по состоянию здоровья.',
      city: 'Алматы',
      imageUrl: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400',
      status: 'OPEN',
      createdBy: '3',
      assignedTo: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      points: 25,
      latitude: 43.2220,
      longitude: 76.8512
    }
  ];

  let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  
  // Обновляем города в существующих заданиях на казахстанские
  const cityMap = {
    'Москва': 'Алматы',
    'Санкт-Петербург': 'Астана',
    'Казань': 'Шымкент',
    'Новосибирск': 'Караганда',
    'Екатеринбург': 'Актобе',
    'Нижний Новгород': 'Павлодар',
    'Краснодар': 'Тараз'
  };
  
  if (tasks.length > 0) {
    tasks = tasks.map(task => {
      // Если город российский, заменяем на ближайший казахстанский
      if (cityMap[task.city]) {
        const newCity = cityMap[task.city];
        const newCoords = cityCoordinates[newCity] || cityCoordinates['Алматы'];
        return {
          ...task,
          city: newCity,
          latitude: newCoords.lat,
          longitude: newCoords.lng,
          address: task.address ? task.address.replace(task.city, newCity) : newCity
        };
      }
      return task;
    });
    // Сохраняем обновленные задания
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  defaultUsers.forEach(defaultUser => {
    const existingUser = users.find(u => u.id === defaultUser.id || u.login === defaultUser.login);
    if (existingUser) {
      Object.assign(existingUser, defaultUser);
    } else {
      users.push(defaultUser);
    }
  });

  if (tasks.length === 0) {
    tasks = defaultTasks;
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

seedData();

export const mockApi = {
  async login(login, password) {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => (u.login === login || u.email === login) && u.password === password);
    
    if (!user) {
      throw new Error('Неверный логин или пароль');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async register(userData) {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    if (users.find(u => u.login === userData.login)) {
      throw new Error('Пользователь с таким логином уже существует');
    }
    
    const newUser = {
      id: String(Date.now()),
      ...userData,
      role: 'USER',
      points: 200
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async getTasks(userId, role) {
    await delay(500);
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    return tasks;
  },

  async getUsers() {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.map(({ password, ...u }) => u);
  },

  async createTask(taskData) {
    await delay(500);
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    const creator = users.find(u => u.id === taskData.createdBy);
    
    if (creator) {
       const pointsToDeduct = parseInt(taskData.points) || 0;
       if (creator.points >= pointsToDeduct) {
         creator.points -= pointsToDeduct;
         localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
       }
    }
    
    const newTask = {
      id: String(Date.now()),
      ...taskData,
      status: 'PENDING',
      assignedTo: null,
      createdAt: new Date().toISOString(),
      // Сохраняем координаты если они есть
      latitude: taskData.latitude,
      longitude: taskData.longitude,
      // Сохраняем адрес
      address: taskData.address || taskData.city || '',
      // Сохраняем изображения
      images: taskData.images || (taskData.imageUrl ? [taskData.imageUrl] : [])
    };
    
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    
    return newTask;
  },

  async updateTaskStatus(taskId, status, userId = null, reportData = null) {
    await delay(300);
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) throw new Error('Задание не найдено');
    
    task.status = status;
    
    if (status === 'IN_PROGRESS' && userId) {
      // Проверяем, что задание еще не взято
      if (task.assignedTo && task.assignedTo !== userId) {
        throw new Error('Задание уже взято другим волонтером');
      }
      task.assignedTo = userId;
    }
    
    if (status === 'REVIEW' && reportData) {
      task.report = reportData;
    }
    
    if (status === 'DONE') {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        // Начисляем баллы волонтеру (assignedTo), а не текущему пользователю
        const volunteerId = task.assignedTo || userId;
        const volunteer = users.find(u => u.id === volunteerId);
        if (volunteer && task.points) {
            volunteer.points = (volunteer.points || 0) + (task.points || 0);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return task;
  },

  async abandonTask(taskId, volunteerId) {
    await delay(300);
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && volunteerId) {
        // Находим волонтера и создателя
        const volunteer = users.find(u => u.id === volunteerId);
        const creator = users.find(u => u.id === task.createdBy);
        
        // Рассчитываем штраф (50% от баллов задания)
        const penalty = Math.floor((task.points || 0) * 0.5);
        
        // Списываем штраф с волонтера
        if (volunteer) {
            volunteer.points = Math.max(0, (volunteer.points || 0) - penalty);
        }
        
        // Возвращаем штраф создателю задания
        if (creator) {
            creator.points = (creator.points || 0) + penalty;
        }
        
        // Обновляем задание
        task.status = 'OPEN';
        task.assignedTo = null;
        
        // Сохраняем изменения
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return { task };
  },

  async updateUser(userId, userData) {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...userData
    };
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  },

  async getChatMessages(taskId) {
    await delay(200);
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES) || '[]');
    return messages.filter(m => m.taskId === taskId).sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  },

  async sendChatMessage(messageData) {
    await delay(200);
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES) || '[]');
    const newMessage = {
      id: String(Date.now()),
      ...messageData
    };
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    return newMessage;
  }
};
