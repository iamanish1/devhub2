import React, { useState, useEffect } from "react";
import Navbar from "../components/NavBar";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { projectTaskApi } from "../services/projectTaskApi";
import { 
  CheckSquare, 
  Users, 
  FolderOpen, 
  BarChart3, 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Eye,
  Send,
  Upload,
  Download,
  Calendar,
  User
} from 'lucide-react';

// Firebase imports for workspace access
import { db } from "../Config/firebase";
import { 
  doc, 
  getDoc 
} from "firebase/firestore";


const ContributionPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Core state
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [userAccess, setUserAccess] = useState(null);
  
  // Task management
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  
  // Chat and communication
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Resources and files
  const [resources, setResources] = useState([]);
  
  // Statistics and progress
  const [statistics, setStatistics] = useState(null);

  // Tab configuration
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'blue' },
    { id: 'team', label: 'Team', icon: Users, color: 'purple' },
    { id: 'resources', label: 'Resources', icon: FolderOpen, color: 'green' },
    { id: 'progress', label: 'Progress', icon: BarChart3, color: 'yellow' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'indigo' }
  ];

  // Load workspace data
  useEffect(() => {
    loadWorkspace();
  }, [projectId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check Firebase workspace access
      await checkWorkspaceAccess();
      
      const data = await projectTaskApi.getWorkspace(projectId);
      setWorkspace(data.workspace);
      setUserAccess(data.userAccess);
      
      // Load tasks
      if (data.workspace.tasks) {
        setTasks(data.workspace.tasks);
      }
      
      // Load resources
      if (data.workspace.resources) {
        setResources(data.workspace.resources);
      }
      
      // Load statistics
      try {
        const statsData = await projectTaskApi.getProjectStatistics(projectId);
        setStatistics(statsData.statistics);
      } catch (statsError) {
        console.error('Failed to load statistics:', statsError);
      }
      
    } catch (err) {
      if (err.message?.includes('not found')) {
        setError('Project workspace not found. Please contact the project owner.');
      } else {
        setError(err.message || 'Failed to load workspace');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check Firebase workspace access
  const checkWorkspaceAccess = async () => {
    try {
      if (!user?._id) {
        throw new Error('User not authenticated');
      }

      console.log(`🔍 Checking workspace access for user ${user._id} on project ${projectId}`);

      // First check workspace_access collection
      const workspaceAccessRef = doc(db, 'workspace_access', `${projectId}_${user._id}`);
      const accessDoc = await getDoc(workspaceAccessRef);
      
      if (accessDoc.exists()) {
        const accessData = accessDoc.data();
        console.log('📋 Workspace access data:', accessData);
        
        if (accessData.status === 'active' && accessData.accessLevel === 'contributor') {
          console.log('✅ User has workspace access as contributor');
          return true;
        } else {
          console.log('⚠️ Workspace access exists but status/level incorrect:', accessData);
        }
      } else {
        console.log('❌ No workspace_access document found');
      }

      // Check project_contributors collection
      const projectContributorRef = doc(db, 'project_contributors', `${projectId}_${user._id}`);
      const contributorDoc = await getDoc(projectContributorRef);
      
      if (contributorDoc.exists()) {
        const contributorData = contributorDoc.data();
        console.log('📋 Project contributor data:', contributorData);
        
        if (contributorData.status === 'active' && contributorData.role === 'contributor') {
          console.log('✅ User has project contributor access');
          return true;
        } else {
          console.log('⚠️ Project contributor exists but status/role incorrect:', contributorData);
        }
      } else {
        console.log('❌ No project_contributors document found');
      }

      // Check if user is project owner by making a backend call
      try {
        console.log('🔍 Checking backend access...');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/workspace/${projectId}/check-access`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Backend response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Backend response data:', data);
          if (data.hasAccess) {
            console.log('✅ User has access via backend check');
            return true;
          } else {
            console.log('❌ Backend denied access:', data.message);
          }
        } else {
          console.log('❌ Backend request failed with status:', response.status);
        }
      } catch (error) {
        console.log('❌ Backend access check failed:', error.message);
      }

      // If we reach here, user doesn't have access
      throw new Error('Access denied: User is not a selected contributor or project owner');
    } catch (error) {
      console.error('Workspace access check failed:', error);
      throw new Error('Access denied: ' + error.message);
    }
  };

  // Create new task
  const handleCreateTask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await projectTaskApi.createTask(projectId, taskForm);
      await loadWorkspace();
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError(null);
      
      await projectTaskApi.completeTask(projectId, taskId, {});
      await loadWorkspace();
    } catch (err) {
      setError(err.message || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      content: newMessage,
      sender: user?.username || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-blue-100 text-blue-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      urgent: { color: 'bg-red-100 text-red-800' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {priority.toUpperCase()}
      </span>
    );
  };



  if (loading && !workspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {workspace?.projectId || 'Project Workspace'}
              </h1>
              {userAccess && (
                <span className="text-sm text-gray-500">
                  {userAccess.isProjectOwner ? 'Project Owner' : 'Team Member'}
                </span>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64">
            <div className="bg-white rounded-lg shadow p-4">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Project Tasks</h2>
                    {(userAccess?.isProjectOwner || userAccess?.userRole === 'admin') && (
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                      </button>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-900">{task.title}</h3>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {task.assignedTo && (
                                <span className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {task.assignedTo}
                                </span>
                              )}
                              
                              {task.dueDate && (
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => console.log('Task selected:', task)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {(userAccess?.isProjectOwner || task.assignedTo === user?.username) && (
                              <button
                                onClick={() => handleCompleteTask(task._id)}
                                disabled={task.status === 'completed'}
                                className="p-2 text-green-400 hover:text-green-600 disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {tasks.length === 0 && (
                      <div className="text-center py-8">
                        <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No tasks found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Members</h2>
                
                {workspace?.teamMembers && workspace.teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspace.teamMembers.map(member => (
                      <div key={member.userId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{member.userId}</h3>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              member.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {member.joinedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Joined:</span>
                              <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No team members found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Project Resources</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </button>
                </div>
                
                {resources && resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(resource => (
                      <div key={resource._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{resource.title}</h3>
                            <p className="text-sm text-gray-600">{resource.type}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <span className="text-xs text-gray-500">
                            {new Date(resource.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No resources uploaded yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Progress</h2>
                
                {statistics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckSquare className="w-8 h-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Tasks</p>
                          <p className="text-2xl font-bold text-blue-900">{statistics.totalTasks}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-600">Completed</p>
                          <p className="text-2xl font-bold text-green-900">{statistics.completedTasks}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-yellow-600">In Progress</p>
                          <p className="text-2xl font-bold text-yellow-900">{statistics.inProgressTasks}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-purple-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-600">Team Members</p>
                          <p className="text-2xl font-bold text-purple-900">{workspace?.teamMembers?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No progress data available.</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Team Chat</h2>
                </div>
                
                <div className="h-96 flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{msg.sender}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateTask}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Task'}
              </button>
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributionPage;
