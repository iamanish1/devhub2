/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import {
  FaCheck,
  FaEdit,
  FaRegStickyNote,
  FaPaperPlane,
  FaComments,
  FaBars,
  FaUser,
  FaTrash,
  FaPlus,
  FaPen,
  FaFolderOpen,
  FaChevronDown,
  FaRobot,
  FaUsers,
  FaChartBar,
  FaCalendar,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaUpload,
  FaDownload,
  FaFileAlt,
  FaLink,
  FaStar,
  FaTrophy,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaSync,
  FaPlay,
  FaPause,
  FaStop,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaHistory,
} from "react-icons/fa";
import axios from "axios";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit 
} from "firebase/firestore";
import { db } from "../Config/firebase";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { projectTaskApi } from "../services/projectTaskApi";
import { notificationService } from "../services/notificationService";
import { projectSelectionApi } from "../services/projectSelectionApi";
const Socket_URl =
  import.meta.env.VITE_SOCKET_SERVER || `${import.meta.env.VITE_API_URL}`;

const AdminContributionBoard = ({
  tasks: initialTasks = [],
  chat: initialChat = [],
  team = [],
  notes: initialNotes = "",
  onTaskStatusChange,
  onSendMessage,
  onNotesChange,
  onTaskAdd,
  onTaskEdit,
  onTaskDelete,
}) => {
  // State
  const [tasks, setTasks] = useState(initialTasks);
  const [chat, setChat] = useState([
    {
      sender: "admin",
      senderName: "Admin User",
      content: "Welcome to the project team chat! Let's collaborate effectively.",
      timestamp: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      sender: "contributor1",
      senderName: "John Developer",
      content: "Thanks! I've started working on the frontend components.",
      timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
    },
    {
      sender: "contributor2",
      senderName: "Sarah Designer",
      content: "I've uploaded the latest design mockups to the resources section.",
      timestamp: new Date(Date.now() - 900000) // 15 minutes ago
    },
    {
      sender: "admin",
      senderName: "Admin User",
      content: "Great work everyone! Let's keep up the momentum.",
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    }
  ]);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAiTaskModal, setShowAiTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ 
    title: "", 
    desc: "", 
    priority: "medium",
    dueDate: "",
    assignedTo: "",
    estimatedHours: 0
  });
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const chatEndRef = useRef(null);
  const socket = useRef(null);
  const { user } = useAuth();

  // Enhanced Contribution State
  const [activeTab, setActiveTab] = useState('tasks');
  const [workspace, setWorkspace] = useState(null);
  const [userAccess, setUserAccess] = useState(null);
  const [resources, setResources] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'file',
    url: '',
    description: '',
    file: null
  });
  const [selectedResource, setSelectedResource] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Real-time Firebase listeners
  const [firebaseListeners, setFirebaseListeners] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState(null);
  const [taskComments, setTaskComments] = useState({});
  const [taskFiles, setTaskFiles] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([
    {
      id: 1,
      userId: "admin",
      username: "Admin User",
      lastSeen: new Date()
    },
    {
      id: 2,
      userId: "contributor1",
      username: "John Developer",
      lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: 3,
      userId: "contributor2",
      username: "Sarah Designer",
      lastSeen: new Date(Date.now() - 600000) // 10 minutes ago
    }
  ]);
  const [notifications, setNotifications] = useState([]);

  // Time tracking state
  const [activeTimeTracking, setActiveTimeTracking] = useState({});
  const [timeTrackingData, setTimeTrackingData] = useState({});

  // Fetch projects from API
  useEffect(() => {
    setProjectsLoading(true);
    setProjectsError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/myproject`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        // Only use id, title, description
        const fetchedProjects = (res.data.projects || []).map((proj) => ({
          id: proj._id,
          title: proj.project_Title,
          description: proj.Project_Description,
        }));
        console.log("Fetched Projects:", fetchedProjects);
        setProjects(fetchedProjects);
        // Set selected project to first if not already set or if current is not in list
        if (
          fetchedProjects.length > 0 &&
          !fetchedProjects.find((p) => p.id === selectedProjectId)
        ) {
          setSelectedProjectId(fetchedProjects[0].id);
        }
        if (fetchedProjects.length === 0) setSelectedProjectId("");
      })
      .catch(() => setProjectsError("Failed to fetch projects"))
      .finally(() => setProjectsLoading(false));
  }, []);

  // Enhanced Firebase real-time listeners setup
  useEffect(() => {
    if (!selectedProjectId) return;

    console.log("Setting up enhanced Firebase listeners for project:", selectedProjectId);
    
    const listeners = [];

    // 1. Real-time tasks listener (simplified query)
    const tasksQuery = query(
      collection(db, "project_tasks"),
      where("projectId", "==", selectedProjectId)
    );
    
    const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      console.log("🔄 Firebase tasks update:", snapshot.docChanges().length, 'changes');
      const tasksData = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      // Sort tasks by createdAt in JavaScript instead of Firebase
      tasksData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
      setTasks(tasksData);
      
      // Update real-time updates state
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        setRealTimeUpdates(prev => ({
          ...prev,
          [`task_${change.doc.id}`]: {
            type: change.type,
            data: data,
            timestamp: new Date()
          }
        }));
      });
    }, (error) => {
      console.error("❌ Firebase tasks listener error:", error);
      // Fallback to API if Firebase fails
      loadTasksFromAPI();
    });
    listeners.push(tasksUnsubscribe);

    // 2. Real-time team members listener
    const teamQuery = query(
      collection(db, "project_contributors"),
      where("projectId", "==", selectedProjectId)
    );
    
    const teamUnsubscribe = onSnapshot(teamQuery, (snapshot) => {
      console.log("🔄 Firebase team update:", snapshot.docChanges().length, 'changes');
      const teamData = [];
      snapshot.forEach((doc) => {
        teamData.push({ id: doc.id, ...doc.data() });
      });
      setTeamMembers(teamData);
    }, (error) => {
      console.error("❌ Firebase team listener error:", error);
    });
    listeners.push(teamUnsubscribe);

    // 3. Real-time task comments listener (simplified query)
    const commentsQuery = query(
      collection(db, "task_comments"),
      where("projectId", "==", selectedProjectId)
    );
    
    const commentsUnsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      console.log("🔄 Firebase comments update:", snapshot.docChanges().length, 'changes');
      const commentsData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!commentsData[data.taskId]) {
          commentsData[data.taskId] = [];
        }
        commentsData[data.taskId].push({ id: doc.id, ...data });
      });
      // Sort comments by createdAt in JavaScript instead of Firebase
      Object.keys(commentsData).forEach(taskId => {
        commentsData[taskId].sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        });
      });
      setTaskComments(commentsData);
    }, (error) => {
      console.error("❌ Firebase comments listener error:", error);
    });
    listeners.push(commentsUnsubscribe);

    // 4. Real-time task files listener (simplified query)
    const filesQuery = query(
      collection(db, "task_files"),
      where("projectId", "==", selectedProjectId)
    );
    
    const filesUnsubscribe = onSnapshot(filesQuery, (snapshot) => {
      console.log("🔄 Firebase files update:", snapshot.docChanges().length, 'changes');
      const filesData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!filesData[data.taskId]) {
          filesData[data.taskId] = [];
        }
        filesData[data.taskId].push({ id: doc.id, ...data });
      });
      // Sort files by uploadedAt in JavaScript instead of Firebase
      Object.keys(filesData).forEach(taskId => {
        filesData[taskId].sort((a, b) => {
          const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt);
          const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt);
          return dateB - dateA;
        });
      });
      setTaskFiles(filesData);
    }, (error) => {
      console.error("❌ Firebase files listener error:", error);
    });
    listeners.push(filesUnsubscribe);

    // 5. Real-time online users listener (simplified query)
    const onlineQuery = query(
      collection(db, "online_users"),
      where("projectId", "==", selectedProjectId)
    );
    
    const onlineUnsubscribe = onSnapshot(onlineQuery, (snapshot) => {
      console.log("🔄 Firebase online users update:", snapshot.docChanges().length, 'changes');
      const onlineData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter online users in JavaScript instead of Firebase
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const lastSeen = data.lastSeen?.toDate?.() || new Date(data.lastSeen);
        if (lastSeen > fiveMinutesAgo) {
          onlineData.push({ id: doc.id, ...data });
        }
      });
      setOnlineUsers(onlineData);
    }, (error) => {
      console.error("❌ Firebase online users listener error:", error);
    });
    listeners.push(onlineUnsubscribe);

    // 6. Real-time notifications listener (simplified query)
    const notificationsQuery = query(
      collection(db, "project_notifications"),
      where("projectId", "==", selectedProjectId)
    );
    
    const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      console.log("🔄 Firebase notifications update:", snapshot.docChanges().length, 'changes');
      const notificationsData = [];
      snapshot.forEach((doc) => {
        notificationsData.push({ id: doc.id, ...doc.data() });
      });
      // Sort and limit notifications in JavaScript instead of Firebase
      notificationsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      }).slice(0, 50); // Limit to 50 most recent
      setNotifications(notificationsData);
    }, (error) => {
      console.error("❌ Firebase notifications listener error:", error);
    });
    listeners.push(notificationsUnsubscribe);

    // 7. Real-time workspace updates listener
    const workspaceRef = doc(db, "project_workspaces", selectedProjectId);
    const workspaceUnsubscribe = onSnapshot(workspaceRef, (doc) => {
      if (doc.exists()) {
        console.log("🔄 Firebase workspace update");
        setWorkspace({ id: doc.id, ...doc.data() });
      }
    }, (error) => {
      console.error("❌ Firebase workspace listener error:", error);
    });
    listeners.push(workspaceUnsubscribe);

    // 8. Real-time project resources listener
    const resourcesQuery = query(
      collection(db, "project_resources"),
      where("projectId", "==", selectedProjectId)
    );
    
    const resourcesUnsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      console.log("🔄 Firebase resources update:", snapshot.docChanges().length, 'changes');
      const resourcesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        resourcesData.push({
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate?.() || new Date(data.uploadedAt)
        });
      });
      // Sort resources by uploadedAt in JavaScript instead of Firebase
      resourcesData.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt);
        const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt);
        return dateB - dateA;
      });
      setResources(resourcesData);
    }, (error) => {
      console.error("❌ Firebase resources listener error:", error);
      // Fallback to API if Firebase fails
      loadResourcesFromAPI();
    });
    listeners.push(resourcesUnsubscribe);

    // Store listeners for cleanup
    setFirebaseListeners(listeners);

    return () => {
      console.log("🧹 Cleaning up Firebase listeners for project:", selectedProjectId);
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, [selectedProjectId]);

  // Update user's online status
  useEffect(() => {
    if (!selectedProjectId || !user?._id) return;

    const updateOnlineStatus = async () => {
      try {
        const onlineRef = doc(db, "online_users", `${selectedProjectId}_${user._id}`);
        await setDoc(onlineRef, {
          projectId: selectedProjectId,
          userId: user._id,
          username: user.username || user.name,
          lastSeen: serverTimestamp(),
          isOnline: true
        }, { merge: true });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    updateOnlineStatus();
    
    // Update every 30 seconds
    const interval = setInterval(updateOnlineStatus, 30000);
    
    return () => {
      clearInterval(interval);
      // Mark as offline when component unmounts
      if (selectedProjectId && user?._id) {
        const onlineRef = doc(db, "online_users", `${selectedProjectId}_${user._id}`);
        setDoc(onlineRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }, { merge: true }).catch(console.error);
      }
    };
  }, [selectedProjectId, user]);

  // Enhanced task management with Firebase real-time updates
  const handleEnhancedTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !selectedProjectId) return;

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.desc,
        priority: taskForm.priority || 'medium',
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || user._id,
        estimatedHours: taskForm.estimatedHours || 0,
        status: 'pending'
      };

      if (editTask) {
        // Update existing task
        await projectTaskApi.updateTask(selectedProjectId, editTask.id, taskData);
        notificationService.success('Task updated successfully');
      } else {
        // Create new task
        const result = await projectTaskApi.createTask(selectedProjectId, taskData);
        notificationService.success('Task created successfully');
        
        // Create notification
        await addDoc(collection(db, "project_notifications"), {
          projectId: selectedProjectId,
          type: 'task_created',
          title: 'New Task Created',
          message: `Task "${taskForm.title}" has been created`,
          createdBy: user._id,
          createdAt: serverTimestamp(),
          readBy: []
        });
      }

      setShowTaskModal(false);
      setEditTask(null);
      setTaskForm({ title: "", desc: "", priority: "medium", dueDate: "", assignedTo: "", estimatedHours: 0 });
    } catch (error) {
      console.error("Error handling task:", error);
      notificationService.error('Failed to save task');
    }
  };

  // Enhanced task status change with Firebase updates
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await projectTaskApi.updateTask(selectedProjectId, taskId, { status: newStatus });
      
      // Create notification for status change
      await addDoc(collection(db, "project_notifications"), {
        projectId: selectedProjectId,
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: `Task status changed to ${newStatus}`,
        taskId: taskId,
        createdBy: user._id,
        createdAt: serverTimestamp(),
        readBy: []
      });

      notificationService.success('Task status updated');
    } catch (error) {
      console.error("Error updating task status:", error);
      notificationService.error('Failed to update task status');
    }
  };

  // Time tracking functionality
  const startTimeTracking = async (taskId) => {
    try {
      const trackingRef = doc(db, "time_tracking", `${selectedProjectId}_${taskId}_${user._id}`);
      await setDoc(trackingRef, {
        projectId: selectedProjectId,
        taskId: taskId,
        userId: user._id,
        startTime: serverTimestamp(),
        isActive: true
      });

      setActiveTimeTracking(prev => ({
        ...prev,
        [taskId]: {
          startTime: new Date(),
          taskId: taskId
        }
      }));

      notificationService.success('Time tracking started');
    } catch (error) {
      console.error("Error starting time tracking:", error);
      notificationService.error('Failed to start time tracking');
    }
  };

  const stopTimeTracking = async (taskId) => {
    try {
      const trackingRef = doc(db, "time_tracking", `${selectedProjectId}_${taskId}_${user._id}`);
      const trackingDoc = await trackingRef.get();
      
      if (trackingDoc.exists()) {
        const data = trackingDoc.data();
        const startTime = data.startTime.toDate();
        const endTime = new Date();
        const hours = (endTime - startTime) / (1000 * 60 * 60);

        await updateDoc(trackingRef, {
          endTime: serverTimestamp(),
          isActive: false,
          duration: hours
        });

        // Add time log to task
        await projectTaskApi.completeTask(selectedProjectId, taskId, {
          actualHours: hours,
          completionNotes: `Time logged: ${hours.toFixed(2)} hours`
        });
      }

      setActiveTimeTracking(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });

      notificationService.success('Time tracking stopped');
    } catch (error) {
      console.error("Error stopping time tracking:", error);
      notificationService.error('Failed to stop time tracking');
    }
  };

  // Enhanced resource management with Firebase
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const resourceData = {
        name: resourceForm.name,
        type: resourceForm.type,
        description: resourceForm.description
      };

      if (resourceForm.type === 'file' && resourceForm.file) {
        resourceData.file = resourceForm.file;
      } else if (resourceForm.type === 'link' && resourceForm.url) {
        resourceData.url = resourceForm.url;
      } else if (resourceForm.type === 'document' && resourceForm.file) {
        resourceData.file = resourceForm.file;
      } else {
        notificationService.error('Please provide a file or URL based on the resource type');
        return;
      }

      await projectTaskApi.uploadProjectResource(selectedProjectId, resourceData);
      notificationService.success('Resource added successfully');
      
      setShowResourceModal(false);
      setResourceForm({ name: '', type: 'file', url: '', description: '', file: null });
    } catch (error) {
      console.error('Error uploading resource:', error);
      notificationService.error('Failed to add resource: ' + (error.message || 'Unknown error'));
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId) => {
    if (!selectedProjectId || !resourceId) return;

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this resource? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await projectTaskApi.deleteProjectResource(selectedProjectId, resourceId);
      notificationService.success('Resource deleted successfully');
    } catch (error) {
      console.error('Error deleting resource:', error);
      notificationService.error('Failed to delete resource: ' + (error.message || 'Unknown error'));
    }
  };

  // Update resource
  const handleUpdateResource = async (resourceId, updateData) => {
    if (!selectedProjectId || !resourceId) return;

    try {
      await projectTaskApi.updateProjectResource(selectedProjectId, resourceId, updateData);
      notificationService.success('Resource updated successfully');
    } catch (error) {
      console.error('Error updating resource:', error);
      notificationService.error('Failed to update resource: ' + (error.message || 'Unknown error'));
    }
  };

  // Load resources from API
  const loadResourcesFromAPI = async () => {
    if (!selectedProjectId) return;
    
    try {
      setResourcesLoading(true);
      console.log('🔄 Loading resources from API as Firebase fallback...');
      const response = await projectTaskApi.getProjectResources(selectedProjectId);
      if (response.resources) {
        setResources(response.resources);
        console.log('✅ Loaded', response.resources.length, 'resources from API');
      }
    } catch (error) {
      console.error('❌ Failed to load resources from API:', error);
      notificationService.error('Failed to load resources: ' + (error.message || 'Unknown error'));
    } finally {
      setResourcesLoading(false);
    }
  };

  // Real-time chat with Firebase
  const sendMessage = async () => {
    if (message.trim() && selectedProjectId && user?._id) {
      try {
        await addDoc(collection(db, "project_chats"), {
          projectId: selectedProjectId,
          senderId: user._id,
          senderName: user.username || user.name,
          content: message,
          timestamp: serverTimestamp()
        });

        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
        notificationService.error('Failed to send message');
      }
    }
  };

  // Enhanced Tab Configuration
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: FaRegStickyNote, color: 'blue' },
    { id: 'team', label: 'Team', icon: FaUsers, color: 'purple' },
    { id: 'resources', label: 'Resources', icon: FaFolderOpen, color: 'green' },
    { id: 'progress', label: 'Progress', icon: FaChartBar, color: 'yellow' },
    { id: 'chat', label: 'Chat', icon: FaComments, color: 'indigo' },
    { id: 'notifications', label: 'Notifications', icon: FaBell, color: 'red' }
  ];

  // Load workspace data for enhanced features
  const loadWorkspace = async () => {
    if (!selectedProjectId) return;
    
    try {
      const data = await projectTaskApi.getWorkspace(selectedProjectId);
      setWorkspace(data.workspace);
      setUserAccess(data.userAccess);
      
      // Load resources
      if (data.workspace.resources) {
        setResources(data.workspace.resources);
      }
      
      // Load statistics
      try {
        const statsData = await projectTaskApi.getProjectStatistics(selectedProjectId);
        setStatistics(statsData.statistics);
      } catch (statsError) {
        console.error('Failed to load statistics:', statsError);
        // Set default statistics if API fails
        setStatistics({
          project: { id: selectedProjectId, title: 'Project', description: '' },
          tasks: { total: 0, completed: 0, inProgress: 0, pending: 0, progressPercentage: 0 },
          team: { totalMembers: 0, activeContributors: 0 },
          time: { totalEstimatedHours: 0, totalActualHours: 0, efficiency: 0 }
        });
      }
      
    } catch (err) {
      console.error('Failed to load workspace:', err);
      // Don't show error for workspace loading as it's optional
    }
  };

  // Load team members from API
  const loadTeamMembers = async () => {
    if (!selectedProjectId) return;
    
    try {
      setTeamMembersLoading(true);
      setTeamMembersError(null);
      console.log('🔄 Loading team members for project:', selectedProjectId);
      const response = await projectSelectionApi.getProjectTeamMembers(selectedProjectId);
      
      if (response.teamMembers) {
        setTeamMembers(response.teamMembers);
        console.log('✅ Loaded', response.teamMembers.length, 'team members');
      }
    } catch (error) {
      console.error('❌ Failed to load team members:', error);
      setTeamMembersError(error.message || 'Failed to load team members');
      // Set empty array if API fails
      setTeamMembers([]);
    } finally {
      setTeamMembersLoading(false);
    }
  };

  // Fallback function to load tasks from API when Firebase fails
  const loadTasksFromAPI = async () => {
    if (!selectedProjectId) return;
    
    try {
      console.log('🔄 Loading tasks from API as Firebase fallback...');
      const response = await projectTaskApi.getUserTasks({ projectId: selectedProjectId });
      if (response.tasks) {
        setTasks(response.tasks);
        console.log('✅ Loaded', response.tasks.length, 'tasks from API');
      }
    } catch (error) {
      console.error('❌ Failed to load tasks from API:', error);
    }
  };

  // Fallback function to load statistics from API when Firebase fails
  const loadStatisticsFromAPI = async () => {
    if (!selectedProjectId) return;
    
    try {
      console.log('🔄 Loading statistics from API as Firebase fallback...');
      const response = await projectTaskApi.getProjectStatistics(selectedProjectId);
      if (response.statistics) {
        setStatistics(response.statistics);
        console.log('✅ Loaded statistics from API');
      }
    } catch (error) {
      console.error('❌ Failed to load statistics from API:', error);
    }
  };

  // Load workspace when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadWorkspace();
      loadTeamMembers(); // Load team members when project changes
    }
  }, [selectedProjectId]);

  // Update selected project if projects change
  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.find((p) => p.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0].id);
    }
    if (projects.length === 0) setSelectedProjectId("");
  }, [projects, selectedProjectId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Add/Edit Task
  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log('🔍 Task form submission debug:');
    console.log('  taskForm:', taskForm);
    console.log('  selectedProjectId:', selectedProjectId);
    console.log('  user:', user);
    console.log('  user._id:', user?._id);
    
    if (!taskForm.title.trim() || !selectedProjectId) {
      console.error('❌ Validation failed:');
      console.error('  title:', taskForm.title);
      console.error('  selectedProjectId:', selectedProjectId);
      return;
    }

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.desc,
        priority: taskForm.priority || 'medium',
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || user._id,
        estimatedHours: taskForm.estimatedHours || 0,
        status: 'pending'
      };
      
      console.log('🔍 Task data being sent:', taskData);

      if (editTask) {
        // Update existing task using new API
        const result = await projectTaskApi.updateTask(selectedProjectId, editTask.id, taskData);
        console.log("Updated Task:", result);
        
        setTasks((prev) =>
          prev.map((t) =>
            t.id === (editTask.id || editTask._id)
              ? {
                  ...t,
                  title: taskForm.title,
                  description: taskForm.desc,
                }
              : t
          )
        );
        
        if (onTaskEdit)
          onTaskEdit(editTask.id || editTask._id, {
            ...taskForm,
            projectId: selectedProjectId,
          });
          
        notificationService.success('Task updated successfully');
      } else {
        // Create new task using new API
        console.log('🔍 About to call projectTaskApi.createTask with:');
        console.log('  projectId:', selectedProjectId);
        console.log('  taskData:', taskData);
        
        const result = await projectTaskApi.createTask(selectedProjectId, taskData);
        console.log("Created Task:", result);
        
        // Add the new task to the local state
        const newTask = {
          id: result.task._id,
          title: result.task.title,
          description: result.task.description,
          status: result.task.status,
          priority: result.task.priority,
          assignedTo: result.task.assignedTo,
          createdBy: result.task.createdBy,
          createdAt: result.task.createdAt
        };
        
        setTasks((prev) => [newTask, ...prev]);
        if (onTaskAdd) onTaskAdd(newTask);
        
        notificationService.success('Task created successfully');
      }
    } catch (error) {
      console.error("❌ Error handling task:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // More specific error messages
      if (error.response?.status === 404) {
        notificationService.error('API endpoint not found. Please check server configuration.');
      } else if (error.response?.status === 401) {
        notificationService.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        notificationService.error('Access denied. You may not have permission for this project.');
      } else {
        notificationService.error('Failed to save task: ' + (error.response?.data?.message || error.message));
      }
      return;
    }

    setShowTaskModal(false);
    setEditTask(null);
    setTaskForm({ title: "", desc: "", priority: "medium", dueDate: "", assignedTo: "", estimatedHours: 0 });
  };

  // Dummy AI Task Add
  const handleAiTaskAdd = () => {
    const aiTask = {
      id: Date.now(),
      title: "AI Suggested Task",
      desc: "This task was generated by AI for your project.",
      status: "todo",
      projectId: selectedProjectId,
    };
    setTasks((prev) => [aiTask, ...prev]);
    setShowAiTaskModal(false);
    if (onTaskAdd) onTaskAdd(aiTask);
  };

  // Delete Task
  const handleTaskDelete = async (id) => {
    if (!id || !selectedProjectId) return;
    try {
      await projectTaskApi.deleteTask(selectedProjectId, id);
      console.log("Deleted Task:", id);
      setTasks((prev) => prev.filter((t) => t.id !== id && t._id !== id));
      if (onTaskDelete) onTaskDelete(id);
      setEditTask(null);
      setTaskForm({ title: "", desc: "", priority: "medium", dueDate: "", assignedTo: "", estimatedHours: 0 });
      notificationService.success('Task deleted successfully');
    } catch (error) {
      console.error("Error deleting task:", error);
      notificationService.error('Failed to delete task');
    }
  };

  // Open modal for edit/add
  const openEditModal = (task) => {
    setEditTask(task);
    setTaskForm({ 
      title: task.task_title || task.title, 
      desc: task.task_description || task.description,
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
      assignedTo: task.assignedTo || '',
      estimatedHours: task.estimatedHours || 0
    });
    setShowTaskModal(true);
  };
  const openAddModal = () => {
    setEditTask(null);
    setTaskForm({ title: "", desc: "", priority: "medium", dueDate: "", assignedTo: "", estimatedHours: 0 });
    setShowTaskModal(true);
  };

  // Notes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (onNotesChange) onNotesChange(e.target.value);
  };

  // Progress
  const doneCount = tasks.filter(
    (t) => t.task_status === "done"
  ).length;
  const totalCount = tasks.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Enhanced Task Card Component with Real-time Features
  const TaskCard = ({ task }) => {
    const isTimeTracking = activeTimeTracking[task.id];
    const taskCommentsList = taskComments[task.id] || [];
    const taskFilesList = taskFiles[task.id] || [];

    return (
      <div className="bg-[#181b23] rounded-xl p-4 border border-blue-500/10 hover:border-blue-400/30 transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
              {task.task_title || task.title}
            </h4>
            <p className="text-gray-400 text-sm line-clamp-2">
              {task.task_description || task.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {/* Priority Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              task.priority === 'urgent' ? 'bg-red-900/40 text-red-400' :
              task.priority === 'high' ? 'bg-orange-900/40 text-orange-400' :
              task.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
              'bg-blue-900/40 text-blue-400'
            }`}>
              {task.priority?.toUpperCase() || 'MEDIUM'}
            </span>
            
            {/* Status Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              task.task_status === 'done' || task.status === 'completed' ? 'bg-green-900/40 text-green-400' :
              task.task_status === 'inprogress' || task.status === 'in_progress' ? 'bg-purple-900/40 text-purple-400' :
              'bg-blue-900/40 text-blue-400'
            }`}>
              {task.task_status?.toUpperCase() || task.status?.toUpperCase() || 'TODO'}
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <FaCalendar className="text-blue-400" />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.estimatedHours > 0 && (
            <div className="flex items-center gap-1">
              <FaClock className="text-yellow-400" />
              <span>Est: {task.estimatedHours}h</span>
            </div>
          )}
          {task.actualHours > 0 && (
            <div className="flex items-center gap-1">
              <FaClock className="text-green-400" />
              <span>Actual: {task.actualHours}h</span>
            </div>
          )}
        </div>

        {/* Time Tracking Controls */}
        <div className="flex items-center gap-2 mb-3">
          {!isTimeTracking ? (
            <button
              onClick={() => startTimeTracking(task.id)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FaPlay className="text-xs" />
              Start Timer
            </button>
          ) : (
            <button
              onClick={() => stopTimeTracking(task.id)}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FaStop className="text-xs" />
              Stop Timer
            </button>
          )}
          
          {/* Comments Count */}
          {taskCommentsList.length > 0 && (
            <span className="flex items-center gap-1 text-blue-400 text-xs">
              <FaComments />
              {taskCommentsList.length}
            </span>
          )}
          
          {/* Files Count */}
          {taskFilesList.length > 0 && (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <FaFileAlt />
              {taskFilesList.length}
            </span>
          )}
        </div>

        {/* Task Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(task)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
          >
            <FaEdit />
            Edit
          </button>
          
          <button
            onClick={() => handleTaskDelete(task.id)}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
          >
            <FaTrash />
            Delete
          </button>
          
          {/* Status Change Buttons */}
          {task.task_status !== 'done' && task.status !== 'completed' && (
            <button
              onClick={() => handleTaskStatusChange(task.id, 'completed')}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FaCheck />
              Complete
            </button>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Team Member Card Component
  const TeamMemberCard = ({ member }) => {
    const isOnline = onlineUsers.some(user => user.userId === member.userId);
    
    return (
      <div className="bg-[#181b23] rounded-xl p-4 border border-purple-500/10 hover:border-purple-400/30 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img
              src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}`}
              alt={member.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#181b23] ${
              isOnline ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white">{member.username}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                member.role === 'project_owner' ? 'bg-blue-900/40 text-blue-400' :
                member.role === 'contributor' ? 'bg-green-900/40 text-green-400' :
                'bg-gray-900/40 text-gray-400'
              }`}>
                {member.role === 'project_owner' ? 'Owner' : 'Contributor'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{member.bio || 'No bio available'}</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 space-y-1 mb-3">
          {member.email && (
            <div>Email: {member.email}</div>
          )}
          <div>Joined: {new Date(member.selectedAt || member.joinedAt).toLocaleDateString()}</div>
          {member.bidAmount && (
            <div>Bid Amount: ₹{member.bidAmount}</div>
          )}
          {member.experience && (
            <div>Experience: {member.experience} years</div>
          )}
          {member.hoursPerWeek && (
            <div>Hours/Week: {member.hoursPerWeek}</div>
          )}
          {member.selectionScore && (
            <div>Selection Score: {member.selectionScore}/100</div>
          )}
          {member.selectionReason && (
            <div>Selection: {member.selectionReason}</div>
          )}
        </div>

        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Skills:</div>
            <div className="flex flex-wrap gap-1">
              {member.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 3 && (
                <span className="text-gray-400 text-xs">+{member.skills.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(member.github || member.linkedIn || member.website || member.instagram) && (
          <div className="flex gap-2">
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                GitHub
              </a>
            )}
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                LinkedIn
              </a>
            )}
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                Website
              </a>
            )}
            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                Instagram
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // Notification Card Component
  const NotificationCard = ({ notification }) => {
    const isUnread = !notification.readBy?.includes(user?._id);
    
    return (
      <div className={`bg-[#181b23] rounded-xl p-4 border transition-all ${
        isUnread ? 'border-red-500/30 bg-red-900/10' : 'border-gray-500/10'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-2 ${
            isUnread ? 'bg-red-400' : 'bg-gray-400'
          }`}></div>
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">{notification.title}</h4>
            <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
            <div className="text-xs text-gray-500">
              {notification.createdAt?.toDate?.() ? 
                new Date(notification.createdAt.toDate()).toLocaleString() :
                new Date(notification.createdAt).toLocaleString()
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Project Management</h1>
          <p className="text-gray-300">Manage your project tasks, team, and resources in real-time</p>
        </div>

        {/* Project Selector */}
        <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Select Project</h2>
            <div className="flex items-center gap-2">
              <FaSync className="text-blue-400" />
              <span className="text-sm text-gray-400">Real-time updates enabled</span>
            </div>
          </div>
          
          {projectsLoading ? (
            <div className="text-blue-300">Loading projects...</div>
          ) : projectsError ? (
            <div className="text-red-400">{projectsError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    selectedProjectId === project.id
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-gray-600 hover:border-blue-400/50 bg-[#181b23]'
                  }`}
                >
                  <h3 className="font-semibold text-white mb-1">{project.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProjectId && (
          <>
            {/* Real-time Status Bar */}
            <div className="bg-[#232a34] rounded-2xl p-4 border border-blue-500/10 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {onlineUsers.length} team members online
                  </div>
                  <div className="text-sm text-gray-400">
                    {notifications.filter(n => !n.readBy?.includes(user?._id)).length} unread notifications
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaBell className="text-yellow-400" />
                  <span className="text-sm text-gray-400">Real-time notifications</span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-[#232a34] rounded-2xl p-2 border border-blue-500/10 mb-6">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-blue-500/10'
                    }`}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10">
              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Project Tasks</h2>
                    <button
                      onClick={openAddModal}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaPlus />
                      Add Task
                    </button>
                  </div>

                  {/* Task Statistics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">{tasks.length}</div>
                      <div className="text-sm text-gray-400">Total Tasks</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {tasks.filter(t => t.task_status === 'todo' || t.status === 'pending').length}
                      </div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {tasks.filter(t => t.task_status === 'inprogress' || t.status === 'in_progress').length}
                      </div>
                      <div className="text-sm text-gray-400">In Progress</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {tasks.filter(t => t.task_status === 'done' || t.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                  </div>

                  {/* Tasks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>

                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaRegStickyNote className="text-4xl mx-auto mb-4" />
                      <p>No tasks found for this project.</p>
                      <p className="text-sm">Create your first task to get started.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Team Members</h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={loadTeamMembers}
                        disabled={teamMembersLoading}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        <FaSync className={`text-xs ${teamMembersLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <div className="flex items-center gap-2">
                        <FaSync className="text-blue-400" />
                        <span className="text-sm text-gray-400">Real-time updates</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">{teamMembers.length}</div>
                      <div className="text-sm text-gray-400">Total Members</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {teamMembers.filter(m => m.role === 'contributor').length}
                      </div>
                      <div className="text-sm text-gray-400">Contributors</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {teamMembers.filter(m => m.role === 'project_owner').length}
                      </div>
                      <div className="text-sm text-gray-400">Project Owner</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {onlineUsers.length}
                      </div>
                      <div className="text-sm text-gray-400">Online Now</div>
                    </div>
                  </div>

                  {/* Team Members Grid */}
                  {teamMembersLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p>Loading team members...</p>
                    </div>
                  ) : teamMembersError ? (
                    <div className="text-center py-8 text-red-400">
                      <FaExclamationTriangle className="text-4xl mx-auto mb-4" />
                      <p className="font-semibold mb-2">Error loading team members</p>
                      <p className="text-sm mb-4">{teamMembersError}</p>
                      <button
                        onClick={loadTeamMembers}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers.map((member) => (
                        <TeamMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  )}

                  {!teamMembersLoading && !teamMembersError && teamMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaUsers className="text-4xl mx-auto mb-4" />
                      <p>No team members found.</p>
                      <p className="text-sm">Team members will appear here once they're selected for the project.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Notifications</h2>
                  
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </div>

                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaBell className="text-4xl mx-auto mb-4" />
                      <p>No notifications yet.</p>
                      <p className="text-sm">Notifications will appear here as project activities occur.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Project Resources</h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={loadResourcesFromAPI}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        <FaSync className="text-xs" />
                        Refresh
                      </button>
                      <button
                        onClick={() => setShowResourceModal(true)}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaPlus />
                        Add Resource
                      </button>
                    </div>
                  </div>

                  {/* Resource Statistics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">{resources.length}</div>
                      <div className="text-sm text-gray-400">Total Resources</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {resources.filter(r => r.type === 'file').length}
                      </div>
                      <div className="text-sm text-gray-400">Files</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {resources.filter(r => r.type === 'link').length}
                      </div>
                      <div className="text-sm text-gray-400">Links</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {resources.filter(r => r.type === 'document').length}
                      </div>
                      <div className="text-sm text-gray-400">Documents</div>
                    </div>
                  </div>

                  {/* Resource Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Files Section */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <FaFileAlt className="text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Files</h3>
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {resources.filter(r => r.type === 'file').length}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      {resourcesLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                          <p>Loading resources...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resources.filter(r => r.type === 'file').map((resource, index) => (
                            <div key={resource.id} className="bg-[#232a34] rounded-lg p-3 border border-blue-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white truncate">{resource.name}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}${resource.url}`, '_blank')}
                                    className="text-blue-400 hover:text-blue-300 text-xs"
                                    title="View"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}${resource.url}`, '_blank')}
                                    className="text-green-400 hover:text-green-300 text-xs"
                                    title="Download"
                                  >
                                    <FaDownload />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(resource.id)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2 mb-1">{resource.description}</p>
                              <div className="text-xs text-gray-500">
                                {resource.size && `${(resource.size / 1024 / 1024).toFixed(2)} MB • `}
                                Added: {new Date(resource.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                          {resources.filter(r => r.type === 'file').length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                              <FaFileAlt className="text-2xl mx-auto mb-2" />
                              <p className="text-sm">No files uploaded yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Links Section */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-purple-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <FaLink className="text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Links</h3>
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          {resources.filter(r => r.type === 'link').length}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      {resourcesLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                          <p>Loading resources...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resources.filter(r => r.type === 'link').map((resource, index) => (
                            <div key={resource.id} className="bg-[#232a34] rounded-lg p-3 border border-purple-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white truncate">{resource.name}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => window.open(resource.url, '_blank')}
                                    className="text-purple-400 hover:text-purple-300 text-xs"
                                    title="Open Link"
                                  >
                                    <FaExternalLinkAlt />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(resource.id)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2 mb-1">{resource.description}</p>
                              <div className="text-xs text-gray-500 truncate">
                                {resource.url}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Added: {new Date(resource.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                          {resources.filter(r => r.type === 'link').length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                              <FaLink className="text-2xl mx-auto mb-2" />
                              <p className="text-sm">No links added yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Documents Section */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-yellow-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <FaFileAlt className="text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">Documents</h3>
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          {resources.filter(r => r.type === 'document').length}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      {resourcesLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                          <p>Loading resources...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resources.filter(r => r.type === 'document').map((resource, index) => (
                            <div key={resource.id} className="bg-[#232a34] rounded-lg p-3 border border-yellow-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white truncate">{resource.name}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}${resource.url}`, '_blank')}
                                    className="text-yellow-400 hover:text-yellow-300 text-xs"
                                    title="View"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}${resource.url}`, '_blank')}
                                    className="text-green-400 hover:text-green-300 text-xs"
                                    title="Download"
                                  >
                                    <FaDownload />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(resource.id)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2 mb-1">{resource.description}</p>
                              <div className="text-xs text-gray-500">
                                {resource.size && `${(resource.size / 1024 / 1024).toFixed(2)} MB • `}
                                Added: {new Date(resource.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                          {resources.filter(r => r.type === 'document').length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                              <FaFileAlt className="text-2xl mx-auto mb-2" />
                              <p className="text-sm">No documents added yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {resources.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaFolderOpen className="text-4xl mx-auto mb-4" />
                      <p>No resources found for this project.</p>
                      <p className="text-sm">Add files, links, and documents to help your team.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === 'progress' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Progress Analytics</h2>
                    <div className="flex items-center gap-2">
                      <FaSync className="text-blue-400" />
                      <span className="text-sm text-gray-400">Auto-updating</span>
                    </div>
                  </div>

                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-900/60 to-blue-700/40 rounded-2xl p-6 border border-blue-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaChartBar className="text-3xl text-blue-400" />
                        <span className="text-2xl font-bold text-blue-400">
                          {statistics?.tasks?.progressPercentage || 0}%
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Overall Progress</h3>
                      <div className="w-full bg-blue-900/40 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${statistics?.tasks?.progressPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/60 to-green-700/40 rounded-2xl p-6 border border-green-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaCheckCircle className="text-3xl text-green-400" />
                        <span className="text-2xl font-bold text-green-400">
                          {statistics?.tasks?.completed || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Completed Tasks</h3>
                      <p className="text-gray-300 text-sm">
                        {statistics?.tasks?.total || 0} total tasks
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/60 to-yellow-700/40 rounded-2xl p-6 border border-yellow-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaClock className="text-3xl text-yellow-400" />
                        <span className="text-2xl font-bold text-yellow-400">
                          {statistics?.time?.totalActualHours || 0}h
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Time Spent</h3>
                      <p className="text-gray-300 text-sm">
                        {statistics?.time?.totalEstimatedHours || 0}h estimated
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/60 to-purple-700/40 rounded-2xl p-6 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaUsers className="text-3xl text-purple-400" />
                        <span className="text-2xl font-bold text-purple-400">
                          {statistics?.team?.activeContributors || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Active Contributors</h3>
                      <p className="text-gray-300 text-sm">
                        {statistics?.team?.totalMembers || 0} total members
                      </p>
                    </div>
                  </div>

                  {/* Detailed Progress Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Task Status Distribution */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-blue-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Task Status Distribution</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="text-gray-300">Pending</span>
                          </div>
                          <span className="text-white font-semibold">
                            {statistics?.tasks?.pending || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                            <span className="text-gray-300">In Progress</span>
                          </div>
                          <span className="text-white font-semibold">
                            {statistics?.tasks?.inProgress || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-gray-300">Completed</span>
                          </div>
                          <span className="text-white font-semibold">
                            {statistics?.tasks?.completed || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Time Efficiency */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-green-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Time Efficiency</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Estimated Hours</span>
                          <span className="text-white font-semibold">
                            {statistics?.time?.totalEstimatedHours || 0}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Actual Hours</span>
                          <span className="text-white font-semibold">
                            {statistics?.time?.totalActualHours || 0}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Efficiency</span>
                          <span className={`font-semibold ${
                            (statistics?.time?.efficiency || 0) > 100 ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {statistics?.time?.efficiency || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-[#181b23] rounded-xl p-6 border border-purple-500/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {notifications.slice(0, 5).map((notification, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-[#232a34] rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-white text-sm">{notification.message}</p>
                            <p className="text-gray-400 text-xs">
                              {notification.createdAt?.toDate?.() ? 
                                new Date(notification.createdAt.toDate()).toLocaleString() :
                                new Date(notification.createdAt).toLocaleString()
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-4 text-gray-400">
                          <FaChartBar className="text-2xl mx-auto mb-2" />
                          <p className="text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[600px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Team Chat</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Live</span>
                    </div>
                  </div>

                  {/* Online Users */}
                  <div className="bg-[#181b23] rounded-xl p-4 border border-blue-500/10 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaUsers className="text-blue-400" />
                      <span className="text-sm font-medium text-white">Online Team Members</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {onlineUsers.map((user, index) => (
                        <div key={index} className="flex items-center gap-2 bg-[#232a34] rounded-lg px-3 py-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-white">{user.username}</span>
                        </div>
                      ))}
                      {onlineUsers.length === 0 && (
                        <span className="text-sm text-gray-400">No team members online</span>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 bg-[#181b23] rounded-xl border border-blue-500/10 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chat.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.sender === user?.username || msg.senderId === user?._id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === user?.username || msg.senderId === user?._id
                              ? 'bg-blue-500 text-white'
                              : 'bg-[#232a34] text-white border border-blue-500/20'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium opacity-75">
                                {msg.senderName || msg.sender}
                              </span>
                              <span className="text-xs opacity-50">
                                {msg.timestamp?.toDate?.() ? 
                                  new Date(msg.timestamp.toDate()).toLocaleTimeString() :
                                  new Date(msg.timestamp).toLocaleTimeString()
                                }
                              </span>
                            </div>
                            <p className="text-sm">{msg.content || msg.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-blue-500/10">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 bg-[#232a34] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!message.trim()}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FaPaperPlane />
                          Send
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chat Features */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#181b23] rounded-xl p-4 border border-green-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <FaFileAlt className="text-green-400" />
                        <span className="text-sm font-medium text-white">File Sharing</span>
                      </div>
                      <p className="text-xs text-gray-400">Share files directly in chat</p>
                    </div>
                    <div className="bg-[#181b23] rounded-xl p-4 border border-purple-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBell className="text-purple-400" />
                        <span className="text-sm font-medium text-white">Notifications</span>
                      </div>
                      <p className="text-xs text-gray-400">Real-time message alerts</p>
                    </div>
                    <div className="bg-[#181b23] rounded-xl p-4 border border-yellow-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <FaHistory className="text-yellow-400" />
                        <span className="text-sm font-medium text-white">Message History</span>
                      </div>
                      <p className="text-xs text-gray-400">Access previous conversations</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Resource Modal */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
                Add New Resource
              </h2>
              <form onSubmit={handleResourceSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Resource Name
                    </label>
                    <input
                      type="text"
                      value={resourceForm.name}
                      onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="Enter resource name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Resource Type
                    </label>
                    <select
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value, file: null, url: '' })}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="file">File</option>
                      <option value="link">Link</option>
                      <option value="document">Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {resourceForm.type === 'link' ? 'URL' : 'File Upload'}
                    </label>
                    {resourceForm.type === 'link' ? (
                      <input
                        type="url"
                        value={resourceForm.url}
                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                        placeholder="Enter URL"
                        required
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          onChange={(e) => setResourceForm({ ...resourceForm, file: e.target.files[0] })}
                          className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                          required
                          accept={
                            resourceForm.type === 'document' 
                              ? '.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls'
                              : 'image/*,.pdf,.doc,.docx,.txt,.csv,.zip,.rar'
                          }
                        />
                        {resourceForm.file && (
                          <div className="text-xs text-gray-400">
                            Selected: {resourceForm.file.name} ({(resourceForm.file.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      rows="3"
                      placeholder="Enter resource description"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Resource
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResourceModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
                {editTask ? "Edit Task" : "Create New Task"}
              </h2>
              <form onSubmit={handleEnhancedTaskSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={taskForm.desc}
                      onChange={(e) => setTaskForm({ ...taskForm, desc: e.target.value })}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      rows="3"
                      placeholder="Enter task description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={taskForm.estimatedHours}
                      onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      min="0"
                      step="0.5"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editTask ? "Update Task" : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContributionBoard;