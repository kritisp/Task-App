import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  CheckCircle, 
  Plus, 
  Trash2, 
  LogOut, 
  Loader2, 
  X, 
  Menu,
  Check,
  Circle,
  Clock,
  AlertCircle,
  Server
} from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * STEP 1 CONFIGURATION: FRONTEND ONLY
 * ------------------------ ------------------------------------------
 * We are currently in "Step 1". We set DEMO_MODE to true.
 * This simulates a backend so we can build the UI without waiting for the server.
 * * IN STEP 3: We will simply set this to `false` to connect to our real database.
 */
const DEMO_MODE = false;
const API_BASE_URL = 'https://task-app-api-7mgr.onrender.com/api';

// --- API LAYER (Simulated or Real) ---

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- MOCK BACKEND (Simulates Step 2) ---
// This code mimics what our Node.js/MongoDB server will do later.
const mockDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MockBackend = {
  login: async (email, password) => {
    await mockDelay(800);
    // Accept any password for demo purposes, or specific one
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    return { 
      token: 'mock-jwt-token-123', 
      user: { id: 1, name: 'Demo User', email } 
    };
  },
  register: async (name, email, password) => {
    await mockDelay(800);
    return { 
      token: 'mock-jwt-token-123', 
      user: { id: 1, name, email } 
    };
  },
  fetchTasks: async () => {
    await mockDelay(600);
    const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
    if (tasks.length === 0) {
      // Seed some data so the user sees something immediately
      const seed = [
        { _id: '1', title: 'Start learning Full Stack Development', status: 'in-progress' },
        { _id: '2', title: 'Build the Frontend', status: 'done' },
        { _id: '3', title: 'Setup MongoDB Database', status: 'todo' },
      ];
      localStorage.setItem('mock_tasks', JSON.stringify(seed));
      return seed;
    }
    return tasks;
  },
  createTask: async (task) => {
    await mockDelay(400);
    const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
    const newTask = { ...task, _id: Date.now().toString(), status: 'todo' };
    tasks.push(newTask);
    localStorage.setItem('mock_tasks', JSON.stringify(tasks));
    return newTask;
  },
  updateTask: async (id, updates) => {
    await mockDelay(300);
    const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
    const index = tasks.findIndex(t => t._id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      localStorage.setItem('mock_tasks', JSON.stringify(tasks));
      return tasks[index];
    }
    throw new Error('Task not found');
  },
  deleteTask: async (id) => {
    await mockDelay(300);
    const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
    const filtered = tasks.filter(t => t._id !== id);
    localStorage.setItem('mock_tasks', JSON.stringify(filtered));
    return { success: true };
  }
};

// Unified Service Layer - Switches between Real and Mock based on Config
const taskService = {
  login: async (email, password) => {
    if (DEMO_MODE) return MockBackend.login(email, password);
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name, email, password) => {
    if (DEMO_MODE) return MockBackend.register(name, email, password);
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  getAll: async () => {
    if (DEMO_MODE) return MockBackend.fetchTasks();
    const res = await api.get('/tasks');
    return res.data;
  },
  create: async (title) => {
    if (DEMO_MODE) return MockBackend.createTask({ title });
    const res = await api.post('/tasks', { title });
    return res.data;
  },
  update: async (id, status) => {
    if (DEMO_MODE) return MockBackend.updateTask(id, { status });
    const res = await api.put(`/tasks/${id}`, { status });
    return res.data;
  },
  delete: async (id) => {
    if (DEMO_MODE) return MockBackend.deleteTask(id);
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  }
};

// --- AUTH CONTEXT ---

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from previous session
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- COMPONENTS ---

const Navbar = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate(user ? 'dashboard' : 'home')}>
            <div className="bg-indigo-600 p-2 rounded-lg transition-transform hover:scale-105">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">TaskFlow</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600 text-sm font-medium">Hi, {user.name}</span>
                <div className="h-4 w-px bg-gray-200"></div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')} className="text-gray-600 hover:text-indigo-600 px-4 py-2 text-sm font-medium transition-colors">Login</button>
                <button onClick={() => navigate('register')} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">Get Started</button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-50"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full z-50">
          <div className="px-4 py-3 space-y-2">
          {user ? (
            <>
              <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-50 mb-2">Signed in as {user.name}</div>
              <button 
                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                className="w-full flex items-center text-left text-red-600 hover:bg-red-50 px-3 py-3 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('login'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Login</button>
              <button onClick={() => { navigate('register'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-3 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold">Get Started</button>
            </>
          )}
          </div>
        </div>
      )}
    </nav>
  );
};

const TaskItem = ({ task, onUpdate, onDelete }) => {
  const statusColors = {
    'todo': 'bg-gray-100 text-gray-600 border-gray-200',
    'in-progress': 'bg-blue-50 text-blue-600 border-blue-200',
    'done': 'bg-emerald-50 text-emerald-600 border-emerald-200'
  };

  const statusIcon = {
    'todo': <Circle className="h-4 w-4" />,
    'in-progress': <Clock className="h-4 w-4" />,
    'done': <Check className="h-4 w-4" />
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className={`font-medium text-gray-900 text-base ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusColors[task.status]}`}>
              {statusIcon[task.status]}
              <span className="ml-1.5 capitalize">{task.status.replace('-', ' ')}</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <select 
            value={task.status}
            onChange={(e) => onUpdate(task._id, e.target.value)}
            className="text-xs border-gray-200 rounded-lg py-1.5 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button 
            onClick={() => onDelete(task._id)}
            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PAGES ---

const Home = ({ navigate }) => (
  <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
    <div className="max-w-2xl text-center">
      <div className="inline-flex items-center justify-center p-3 bg-white shadow-lg rounded-2xl mb-8 transform -rotate-2 border border-indigo-50">
        <LayoutDashboard className="h-10 w-10 text-indigo-600" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
        Organize your work, <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">amplify your life.</span>
      </h1>
      <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed">
        The task management app we are building together. Clean, fast, and ready for you to add your own backend.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => navigate('register')}
          className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          Start Demo
        </button>
        <button 
          onClick={() => navigate('login')}
          className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Log In
        </button>
      </div>
      
      {DEMO_MODE && (
        <div className="mt-12 max-w-sm mx-auto bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
               <Server className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Step 1: Frontend Only</p>
              <p className="text-xs text-gray-500 mt-1">
                We are currently in Demo Mode. Data is saved to your browser. In Step 2, we will build the backend.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const AuthForm = ({ type, navigate }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (type === 'login') {
        const data = await taskService.login(formData.email, formData.password);
        login(data);
      } else {
        const data = await taskService.register(formData.name, formData.email, formData.password);
        login(data);
      }
      navigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50/50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-8 border border-white">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {type === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {type === 'login' ? 'Enter your credentials to access your tasks' : 'Start organizing your tasks today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start animate-pulse">
            <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-md shadow-indigo-200"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (type === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          {type === 'login' ? (
            <>Don't have an account? <button onClick={() => navigate('register')} className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => navigate('login')} className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Log in</button></>
          )}
        </div>
        
        {DEMO_MODE && type === 'login' && (
           <div className="mt-6 pt-6 border-t border-gray-100 text-center">
             <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full border border-gray-200">
               Demo Mode Active
             </span>
           </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const newTask = await taskService.create(newTaskTitle);
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const updated = await taskService.update(id, status);
      setTasks(tasks.map(t => t._id === id ? updated : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.delete(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'text-indigo-600', bg: 'bg-white border-indigo-100' },
          { label: 'To Do', value: stats.todo, color: 'text-gray-600', bg: 'bg-white border-gray-200' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-white border-blue-100' },
          { label: 'Completed', value: stats.done, color: 'text-emerald-600', bg: 'bg-white border-emerald-100' }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border shadow-sm ${stat.bg} flex flex-col items-center justify-center transition-transform hover:-translate-y-1`}>
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header & Filter */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-gray-400" />
            My Tasks
          </h2>
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl self-start sm:self-auto">
            {['all', 'todo', 'in-progress', 'done'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Add Task Form */}
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <form onSubmit={handleAddTask} className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="What needs to be done next?"
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm shadow-sm transition-all"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-semibold text-sm transition-colors flex items-center shadow-md shadow-indigo-100"
            >
              <Plus className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="p-6 min-h-[400px] bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                <LayoutDashboard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-semibold text-lg">No tasks found</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                {filter === 'all' 
                  ? "You have no tasks yet. Add one above to get started!" 
                  : `You have no tasks marked as "${filter}".`}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTasks.map(task => (
                <TaskItem 
                  key={task._id} 
                  task={task} 
                  onUpdate={handleUpdateStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- APP ORCHESTRATOR ---

function App() {
  const [page, setPage] = useState('home'); 
  const { user, loading } = useAuth();

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (user && (page === 'login' || page === 'register' || page === 'home')) {
        setPage('dashboard');
      } else if (!user && page === 'dashboard') {
        setPage('login');
      }
    }
  }, [user, page, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'login': return <AuthForm type="login" navigate={setPage} />;
      case 'register': return <AuthForm type="register" navigate={setPage} />;
      case 'dashboard': return user ? <Dashboard navigate={setPage} /> : null;
      default: return <Home navigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      <Navbar navigate={setPage} />
      {renderPage()}
    </div>
  );
}

// Wrapper for Context
export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}