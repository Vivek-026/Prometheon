import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskCreatePage from './pages/TaskCreatePage';
import DocumentHub from './pages/DocumentHub';
import DocumentDetailPage from './pages/DocumentDetailPage';
import FlagDashboard from './pages/FlagDashboard';
import AvailabilityPage from './pages/AvailabilityPage';
import ChatPage from './pages/ChatPage';
import WorklogPage from './pages/WorklogPage';
import NotificationsPage from './pages/NotificationsPage';
import EscalationsDashboard from './pages/admin/EscalationsDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <TaskListPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tasks/new" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager"]}>
              <TaskCreatePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks/:id" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <TaskDetailPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/documents" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <DocumentHub />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/documents/:id" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <DocumentDetailPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/flags" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager"]}>
              <FlagDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/availability" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <AvailabilityPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/chat" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/group/:groupId" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/dm/:threadId" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <ChatPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/worklogs" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <WorklogPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={["admin", "task_manager", "coder"]}>
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/escalations" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EscalationsDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Redirect empty path to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Fallback for all other routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
