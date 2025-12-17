import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider, useTasks } from './contexts/TaskContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import Login from './components/LoginForm';
import { Register } from './pages/Register';
import AdminDashboard from './components/dashboards/AdminDashboard';
import UserDashboard from './components/dashboards/UserDashboard';
import Navbar from './components/Navbar';
import { CreateTaskForm } from './components/CreateTaskForm';
import Profile from './pages/Profile';
import { Chat } from './components/Chat';

// Защита маршрутов
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center text-gray-900 dark:text-white">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <>
      <Navbar />
      <div className="pt-16 sm:pt-20 px-3 sm:px-4 max-w-7xl mx-auto pb-6 sm:pb-10 bg-slate-50 dark:bg-slate-900 min-h-screen">
        {children}
      </div>
    </>
  );
};

// Компонент страницы чата
const ChatPage = () => {
  const { taskId } = useParams();
  const { tasks } = useTasks();
  const task = tasks.find(t => t.id === taskId);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6" style={{ height: '600px' }}>
        <Chat taskId={taskId} task={task} />
      </div>
    </div>
  );
};

function AppContent() {
  const { user, isAdmin, loading } = useAuth();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-white">Загрузка...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          {isAdmin() ? <AdminDashboard /> : <UserDashboard />}
        </PrivateRoute>
      } />

      <Route path="/create-task" element={
        <PrivateRoute>
          <CreateTaskForm />
        </PrivateRoute>
      } />

      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />

      <Route path="/chat/:taskId" element={
        <PrivateRoute>
          <ChatPage />
        </PrivateRoute>
      } />

      {/* Если юзер есть -> в Dashboard, если нет -> в Login */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      
      {/* Если введен несуществующий путь -> тоже на главную (которая сама решит куда дальше) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <TaskProvider>
            <ChatProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </ChatProvider>
          </TaskProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

// Простой Error Boundary для отлова ошибок
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Произошла ошибка
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
