import React, { useState, useEffect } from "react";
import Navbar from "../components/NavBar";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { projectTaskApi } from "../services/projectTaskApi";
import { notificationService } from "../services/notificationService";
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
  User,
  Wallet,
  Trophy,
  Target,
  GitBranch,
  FileText,
  Shield,
  DollarSign,
  TrendingUp,
  Award,
  Star,
  Zap,
  Briefcase,
  Users2,
  MessageCircle,
  Settings,
  Bell
} from 'lucide-react';

// Firebase imports for workspace access
import { db } from "../Config/firebase";
import { 
  doc, 
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  where
} from "firebase/firestore";


const ContributionPage = () => {
  const { _id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Core state
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userAccess, setUserAccess] = useState(null);
  
  // Project overview and financial data
  const [projectOverview, setProjectOverview] = useState(null);
  const [escrowWallet, setEscrowWallet] = useState(null);
  const [bonusPool, setBonusPool] = useState(null);
  const [userEarnings, setUserEarnings] = useState(null);
  
  // Task management
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    estimatedHours: 0,
    chunk: 'general'
  });
  
  // Project chunks/sections
  const [projectChunks, setProjectChunks] = useState([]);
  const [activeChunk, setActiveChunk] = useState('all');
  
  // Chat and communication
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Resources and files
  const [resources, setResources] = useState([]);
  
  // Statistics and progress
  const [statistics, setStatistics] = useState(null);
  
  // Team collaboration
  const [teamMembers, setTeamMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debug state
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target, color: 'blue' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'green' },
    { id: 'chunks', label: 'Project Chunks', icon: GitBranch, color: 'purple' },
    { id: 'team', label: 'Team', icon: Users2, color: 'indigo' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'yellow' },
    { id: 'resources', label: 'Resources', icon: FolderOpen, color: 'orange' },
    { id: 'progress', label: 'Progress', icon: BarChart3, color: 'pink' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, color: 'emerald' }
  ];

  // Load workspace data
  useEffect(() => {
    if (projectId) {
      loadWorkspace();
      loadProjectOverview();
      loadEscrowWalletData();
      loadProjectChunks();
      loadTeamMembers();
      setupRealTimeChat();
    }
  }, [projectId]);

  // Load project overview and financial data
  const loadProjectOverview = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project/getlistproject/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjectOverview(data.project);
        setBonusPool({
          totalAmount: data.project.bonus_pool_amount || 200,
          distributedAmount: 0,
          remainingAmount: data.project.bonus_pool_amount || 200
        });
      }
    } catch (error) {
      console.error('Failed to load project overview:', error);
    }
  };

  // Load escrow wallet data
  const loadEscrowWalletData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/escrow-wallet/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEscrowWallet(data.escrowWallet);
        
        // Calculate user earnings
        if (data.escrowWallet && user?._id) {
          const userFunds = data.escrowWallet.lockedFunds.find(
            fund => fund.userId === user._id
          );
          if (userFunds) {
            setUserEarnings({
              bidAmount: userFunds.bidAmount,
              bonusAmount: userFunds.bonusAmount,
              totalAmount: userFunds.totalAmount,
              status: userFunds.lockStatus
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load escrow wallet data:', error);
    }
  };

  // Load project chunks/sections
  const loadProjectChunks = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/chunks/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjectChunks(data.chunks || [
          { id: 'frontend', name: 'Frontend Development', progress: 0 },
          { id: 'backend', name: 'Backend Development', progress: 0 },
          { id: 'database', name: 'Database Design', progress: 0 },
          { id: 'testing', name: 'Testing & QA', progress: 0 },
          { id: 'deployment', name: 'Deployment', progress: 0 }
        ]);
      }
    } catch (error) {
      console.error('Failed to load project chunks:', error);
      // Set default chunks if API fails
      setProjectChunks([
        { id: 'frontend', name: 'Frontend Development', progress: 0 },
        { id: 'backend', name: 'Backend Development', progress: 0 },
        { id: 'database', name: 'Database Design', progress: 0 },
        { id: 'testing', name: 'Testing & QA', progress: 0 },
        { id: 'deployment', name: 'Deployment', progress: 0 }
      ]);
    }
  };

  // Load team members
  const loadTeamMembers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/team/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.teamMembers || []);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  // Setup real-time chat
  const setupRealTimeChat = () => {
    if (!projectId) return;
    
    const chatRef = collection(db, 'project_chats');
    const chatQuery = query(
      chatRef,
      where('projectId', '==', projectId),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
    });
    
    return unsubscribe;
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !projectId) return;
    
    setChatLoading(true);
    try {
      const chatRef = collection(db, 'project_chats');
      await addDoc(chatRef, {
        projectId,
        senderId: user._id,
        senderName: user.username,
        content: newMessage,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      notificationService.error('Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  // Debug function
  const loadDebugInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/debug/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        console.log('🔍 Debug info:', data);
      } else {
        console.error('❌ Failed to load debug info:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading debug info:', error);
    }
  };

  // Create Firebase access manually
  const createFirebaseAccess = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/firebase-access/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Firebase access created:', data);
        notificationService.success('Firebase access created successfully');
        await loadDebugInfo(); // Refresh debug info
      } else {
        console.error('❌ Failed to create Firebase access:', response.status);
        notificationService.error('Failed to create Firebase access');
      }
    } catch (error) {
      console.error('❌ Error creating Firebase access:', error);
      notificationService.error('Error creating Firebase access');
    }
  };

  // Load bid debug info
  const loadBidDebugInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/debug/${projectId}/bids`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Bid debug info:', data);
        setDebugInfo(prev => ({ ...prev, bidDebug: data }));
      } else {
        console.error('❌ Failed to load bid debug info:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading bid debug info:', error);
    }
  };

  const loadWorkspace = async () => {
    try {
      if (!projectId) {
        setError('Project ID is required');
        return;
      }
      
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

      if (!projectId) {
        throw new Error('Project ID is required');
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

  // Legacy send message function (replaced by Firebase real-time chat)
  const handleLegacySendMessage = () => {
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
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: Clock },
      in_progress: { color: 'bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30', icon: Clock },
      completed: { color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: CheckCircle },
      cancelled: { color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: AlertCircle }
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
      low: { color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
      medium: { color: 'bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30' },
      high: { color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
      urgent: { color: 'bg-red-500/20 text-red-400 border border-red-500/30' }
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
            <div className="space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => setShowDebug(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Debug Access Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug section
  if (showDebug) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Navbar />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Debug Information</h2>
              <div className="space-x-2">
                <button
                  onClick={loadDebugInfo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Refresh Debug Info
                </button>
                <button
                  onClick={createFirebaseAccess}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Firebase Access
                </button>
                <button
                  onClick={loadBidDebugInfo}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Load Bid Debug Info
                </button>
                <button
                  onClick={() => setShowDebug(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close Debug
                </button>
              </div>
            </div>
            
            {debugInfo && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Project Info</h3>
                  <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.project, null, 2)}</pre>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">User Access</h3>
                  <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.user, null, 2)}</pre>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Selection Info</h3>
                  <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.selection, null, 2)}</pre>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Bids</h3>
                  <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.bids, null, 2)}</pre>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Firebase Access</h3>
                  <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.firebase, null, 2)}</pre>
                </div>
                
                {debugInfo.bidDebug && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2">Bid Debug Info</h3>
                    <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.bidDebug, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {projectOverview?.project_Title || workspace?.projectId || 'Project Workspace'}
                </h1>
              </div>
              {userAccess && (
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  {userAccess.isProjectOwner ? 'Project Owner' : 'Team Member'}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button className="p-2 text-gray-300 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64">
            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-4">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
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
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Project Overview Card */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">Project Overview</h2>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">Active</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#00A8E8]/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#00A8E8]">Project Title</p>
                          <p className="text-lg font-semibold text-white">
                            {projectOverview?.project_Title || 'Loading...'}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-[#00A8E8]" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-400">Tech Stack</p>
                          <p className="text-lg font-semibold text-white">
                            {projectOverview?.Project_tech_stack || 'Loading...'}
                          </p>
                        </div>
                        <Zap className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-400">Contributors</p>
                          <p className="text-lg font-semibold text-white">
                            {projectOverview?.Project_Contributor || 0} Required
                          </p>
                        </div>
                        <Users2 className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">Project Description</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {projectOverview?.Project_Description || 'Loading project description...'}
                    </p>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Escrow Wallet Status */}
                  <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Escrow Wallet</h3>
                      <Wallet className="w-6 h-6 text-[#00A8E8]" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Locked Amount:</span>
                        <span className="font-semibold text-white">
                          ₹{escrowWallet?.totalEscrowAmount || 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Your Locked Amount:</span>
                        <span className="font-semibold text-green-400">
                          ₹{userEarnings?.totalAmount || 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          escrowWallet?.status === 'locked' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {escrowWallet?.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bonus Pool */}
                  <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-yellow-500/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Bonus Pool</h3>
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Pool:</span>
                        <span className="font-semibold text-white">
                          ₹{bonusPool?.totalAmount || 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Your Share:</span>
                        <span className="font-semibold text-yellow-400">
                          ₹{userEarnings?.bonusAmount || 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Remaining:</span>
                        <span className="font-semibold text-[#00A8E8]">
                          ₹{bonusPool?.remainingAmount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-[#00A8E8]/20 rounded-lg hover:bg-[#00A8E8]/10 hover:border-[#00A8E8]/40 transition-colors"
                    >
                      <CheckSquare className="w-6 h-6 text-[#00A8E8] mb-2" />
                      <span className="text-sm font-medium text-[#00A8E8]">View Tasks</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-green-500/20 rounded-lg hover:bg-green-500/10 hover:border-green-500/40 transition-colors"
                    >
                      <MessageCircle className="w-6 h-6 text-green-400 mb-2" />
                      <span className="text-sm font-medium text-green-400">Team Chat</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('team')}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-purple-500/20 rounded-lg hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
                    >
                      <Users2 className="w-6 h-6 text-purple-400 mb-2" />
                      <span className="text-sm font-medium text-purple-400">Team Members</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('earnings')}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
                    >
                      <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
                      <span className="text-sm font-medium text-yellow-400">Earnings</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Project Tasks</h2>
                    {(userAccess?.isProjectOwner || userAccess?.userRole === 'admin') && (
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] flex items-center transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                      </button>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task._id} className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-white">{task.title}</h3>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {(userAccess?.isProjectOwner || task.assignedTo === user?.username) && (
                              <button
                                onClick={() => handleCompleteTask(task._id)}
                                disabled={task.status === 'completed'}
                                className="p-2 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
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
                        <CheckSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No tasks found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Project Chunks Tab */}
            {activeTab === 'chunks' && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Project Chunks</h2>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-400">Development Sections</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectChunks.map((chunk) => (
                    <div key={chunk.id} className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{chunk.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-400">Active</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{chunk.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${chunk.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Tasks: {chunk.tasks || 0}</span>
                        <button className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Team Members</h2>
                  <div className="flex items-center space-x-2">
                    <Users2 className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm text-gray-400">{teamMembers.length} Contributors</span>
                  </div>
                </div>
                
                {teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.map(member => (
                      <div key={member.userId} className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{member.username || member.userId}</h3>
                            <p className="text-sm text-gray-400">{member.role || 'Contributor'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              member.isActive 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {member.joinedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Joined:</span>
                              <span className="text-white">{new Date(member.joinedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tasks Completed:</span>
                            <span className="font-medium text-white">{member.completedTasks || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No team members found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                {/* Earnings Overview */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">Your Earnings</h2>
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-400">Bid Amount</p>
                          <p className="text-2xl font-bold text-white">
                            ₹{userEarnings?.bidAmount || 0}
                          </p>
                        </div>
                        <Wallet className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-400">Bonus Pool Share</p>
                          <p className="text-2xl font-bold text-white">
                            ₹{userEarnings?.bonusAmount || 0}
                          </p>
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-400" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#00A8E8]/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#00A8E8]">Total Earnings</p>
                          <p className="text-2xl font-bold text-white">
                            ₹{userEarnings?.totalAmount || 0}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-[#00A8E8]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">Payment Status</h3>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        userEarnings?.status === 'released' 
                          ? 'bg-green-400' 
                          : userEarnings?.status === 'locked'
                          ? 'bg-yellow-400'
                          : 'bg-gray-500'
                      }`}></div>
                      <span className="text-gray-300">
                        {userEarnings?.status === 'released' 
                          ? 'Payment Released - Available for Withdrawal'
                          : userEarnings?.status === 'locked'
                          ? 'Payment Locked - Will be released upon project completion'
                          : 'Payment Pending'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Section */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Withdraw Earnings</h3>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-300">Payment Release Process</h4>
                        <p className="text-sm text-yellow-200 mt-1">
                          Your earnings will be automatically released to your wallet once the project is completed and approved by the project owner.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    disabled={userEarnings?.status !== 'released'}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {userEarnings?.status === 'released' 
                      ? 'Withdraw to Wallet'
                      : 'Payment Locked - Complete Project First'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Project Resources</h2>
                  <button className="px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] flex items-center transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </button>
                </div>
                
                {resources && resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(resource => (
                      <div key={resource._id} className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{resource.title}</h3>
                            <p className="text-sm text-gray-400">{resource.type}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-3">{resource.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
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
                    <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No resources uploaded yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Project Progress</h2>
                
                {statistics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#1A1A1A] border border-[#00A8E8]/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckSquare className="w-8 h-8 text-[#00A8E8] mr-3" />
                        <div>
                          <p className="text-sm font-medium text-[#00A8E8]">Total Tasks</p>
                          <p className="text-2xl font-bold text-white">{statistics.totalTasks}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#1A1A1A] border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-400">Completed</p>
                          <p className="text-2xl font-bold text-white">{statistics.completedTasks}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#1A1A1A] border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-yellow-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-yellow-400">In Progress</p>
                          <p className="text-2xl font-bold text-white">{statistics.inProgressTasks}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#1A1A1A] border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-purple-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-400">Team Members</p>
                          <p className="text-2xl font-bold text-white">{workspace?.teamMembers?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No progress data available.</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Team Chat</h2>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-gray-400">Real-time messaging</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-96 flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto">
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <div key={msg.id} className="mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-white">{msg.senderName || msg.sender}</span>
                                <span className="text-xs text-gray-400">
                                  {msg.timestamp ? new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString() : 'Now'}
                                </span>
                              </div>
                              <p className="text-gray-300">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A8E8] text-white placeholder-gray-400"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={chatLoading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={chatLoading || !newMessage.trim()}
                        className="px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center transition-colors"
                      >
                        {chatLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
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
