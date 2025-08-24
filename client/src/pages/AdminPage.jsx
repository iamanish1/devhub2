/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import AdminContributionBoard from "../components/AdminContributioBoard";
import axios from "axios";
import {
  FaProjectDiagram,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaUserCheck,
  FaUserTimes,
  FaWallet,
  FaCog,
  FaChartLine,
  FaMoneyBillWave,
  FaUserCog,
  FaShieldAlt,
} from "react-icons/fa";
import Navbar from "../components/NavBar";
import { Link } from "react-router-dom";
import { projectSelectionApi } from "../services/projectSelectionApi";
import { escrowWalletApi } from "../services/escrowWalletApi";
import { notificationService } from "../services/notificationService";
import { projectTaskApi } from "../services/projectTaskApi";

// Firebase imports for real-time updates
import { db } from "../Config/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

// Chart.js imports
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const dummyProjects = [];

const dummyApplicants = [
  { id: 1, name: "Anish", project: "AI Chatbot", status: "Pending" },
  { id: 2, name: "Riya", project: "Bug Tracker", status: "Accepted" },
];

const statusColors = {
  Open: "text-green-400 bg-green-900/40",
  Closed: "text-red-400 bg-red-900/40",
  Pending: "text-yellow-400 bg-yellow-900/40",
  Accepted: "text-blue-400 bg-blue-900/40",
  Rejected: "text-red-400 bg-red-900/40",
};

const AdminPage = () => {
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setstats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  For Projects and Applicants
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);

  // Add at the top of your AdminPage component
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState(null);

  const [adminTasks, setAdminTasks] = useState([
    {
      id: 1,
      title: "Review PR #42",
      desc: "Check the latest pull request",
      status: "todo",
    },
    {
      id: 2,
      title: "Merge bugfix branch",
      desc: "Merge after review",
      status: "inprogress",
    },
    {
      id: 3,
      title: "Deploy to production",
      desc: "Deploy after all checks",
      status: "done",
    },
  ]);
  const [adminChat, setAdminChat] = useState([
    { sender: "mentor", text: "Please review the new PR." },
    { sender: "admin", text: "On it!" },
  ]);

  const [adminNotes, setAdminNotes] = useState("Monitor deployment status.");
  const adminMentor = {
    name: "Jane Doe",
    avatar: "https://ui-avatars.com/api/?name=Jane+Doe",
    bio: "Senior Developer, React & Node.js expert.",
    expertise: "Full Stack, Mentorship",
    email: "jane.doe@devhubs.com",
  };



  // Enhanced Applicants State for Selection Integration
  const [applicantsByProject, setApplicantsByProject] = useState({});
  const [selectionConfigs, setSelectionConfigs] = useState({});
  const [showSelectionConfigModal, setShowSelectionConfigModal] = useState(false);
  const [selectedProjectForConfig, setSelectedProjectForConfig] = useState(null);
  const [rankedBidders, setRankedBidders] = useState({});
  const [selectionInProgress, setSelectionInProgress] = useState({});
  
  // Firebase real-time updates state
  const [realTimeUpdates, setRealTimeUpdates] = useState({});
  const [workspaceAccess, setWorkspaceAccess] = useState({});

  // Escrow Wallet System State
  const [escrowWallets, setEscrowWallets] = useState([]);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [escrowError, setEscrowError] = useState(null);
  const [selectedProjectForEscrow, setSelectedProjectForEscrow] = useState(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [escrowStats, setEscrowStats] = useState(null);

  const handleAdminTaskStatusChange = (id, newStatus) => {
    setAdminTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };
  const handleAdminSendMessage = (msg) => {
    setAdminChat((prev) => [...prev, msg]);
  };
  const handleAdminNotesChange = (val) => setAdminNotes(val);
  // Enhanced applicants fetch with project grouping and selection data
  useEffect(() => {
    if (view === "applicants") {
      setApplicantsLoading(true);
      Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/applicant`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        projectSelectionApi.getProjectOwnerSelections()
      ])
        .then(([applicantsRes, selectionsRes]) => {
          const applicants = applicantsRes.data.applicants || [];
          const selections = selectionsRes.selections || [];
          
          // Group applicants by project
          const groupedApplicants = {};
          const configs = {};
          
          applicants.forEach(applicant => {
            const projectId = applicant.project_id?._id || applicant.project_id;
            if (!groupedApplicants[projectId]) {
              groupedApplicants[projectId] = [];
            }
            groupedApplicants[projectId].push(applicant);
          });

          // Create selection configs for each project
          selections.forEach(selection => {
            configs[selection.projectId] = selection;
          });

          setApplicantsByProject(groupedApplicants);
          setSelectionConfigs(configs);
          setApplicants(applicants);
          setApplicantsError(null);
          
          // Set up Firebase real-time listeners for each project
          setupFirebaseListeners(groupedApplicants);
        })
        .catch((error) => {
          console.error("Error fetching applicants and selections:", error);
          setApplicantsError("Failed to fetch applicants and selection data");
        })
        .finally(() => setApplicantsLoading(false));
    }
  }, [view]);

  // Firebase real-time listeners setup
  const setupFirebaseListeners = (groupedApplicants) => {
    Object.keys(groupedApplicants).forEach(projectId => {
      // Listen for applicant status changes (simplified query without orderBy)
      const applicantStatusRef = collection(db, 'applicant_status');
      const applicantQuery = query(
        applicantStatusRef,
        where('projectId', '==', projectId)
      );
      
      const unsubscribe = onSnapshot(applicantQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (change.type === 'modified' || change.type === 'added') {
            setRealTimeUpdates(prev => ({
              ...prev,
              [projectId]: {
                ...prev[projectId],
                [data.userId]: data
              }
            }));
          }
        });
      });

      // Listen for selection status changes (simplified query without orderBy)
      const selectionStatusRef = collection(db, 'selection_status');
      const selectionQuery = query(
        selectionStatusRef,
        where('projectId', '==', projectId)
      );
      
      const selectionUnsubscribe = onSnapshot(selectionQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (change.type === 'modified' || change.type === 'added') {
            setSelectionConfigs(prev => ({
              ...prev,
              [projectId]: {
                ...prev[projectId],
                ...data
              }
            }));
          }
        });
      });

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribe();
        selectionUnsubscribe();
      };
    });
  };



  // Fetch escrow wallets when "escrow" view is active
  useEffect(() => {
    if (view === "escrow") {
      setEscrowLoading(true);
      Promise.all([
        escrowWalletApi.getProjectOwnerEscrows(),
        escrowWalletApi.getEscrowStats()
      ])
        .then(([escrowData, statsData]) => {
          setEscrowWallets(escrowData.escrowWallets || []);
          setEscrowStats(statsData.statistics);
          setEscrowError(null);
        })
        .catch((error) => {
          setEscrowError("Failed to fetch escrow data");
          console.error("Error fetching escrow data:", error);
        })
        .finally(() => setEscrowLoading(false));
    }
  }, [view]);

  // Fetch project for "My projects" section

  useEffect(() => {
    if (view === "projects") {
      setProjectsLoading(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/admin/myproject`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          setProjects(res.data.projects || []);
          console.log("Projects fetched:", res.data.projects);
          setProjectsError(null);
        })
        .catch(() => setProjectsError("Failed to fetch projects"))
        .finally(() => setProjectsLoading(false));
    }
  }, [view]);

  // Dashboard stats
  const totalProjects = stats ? stats.totalProjects : dummyProjects.length;
  const openProjects = stats
    ? stats.totalActiveProjects
    : dummyProjects.filter((p) => p.status === "Open").length;
  const closedProjects = stats
    ? stats.totalCompletedProjects
    : dummyProjects.filter((p) => p.status === "Closed").length;
  const totalApplicants = stats ? stats.totalBids : dummyApplicants.length;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/overview`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setstats(response.data);
        setError(null);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch stats");
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Chart data
  const chartData = {
    labels: [
      "Total Projects",
      "Open Projects",
      "Closed Projects",
      "Applicants",
    ],
    datasets: [
      {
        label: "Overview",
        data: [totalProjects, openProjects, closedProjects, totalApplicants],
        backgroundColor: [
          "rgba(59,130,246,0.7)", // blue for Total Projects
          "rgba(34,197,94,0.7)", // green for Open Projects
          "rgba(239,68,68,0.7)", // red for Closed Projects
          "rgba(251,191,36,0.7)", // orange for Applicants
        ],
        borderColor: [
          "rgba(59,130,246,1)",
          "rgba(34,197,94,1)",
          "rgba(239,68,68,1)",
          "rgba(251,191,36,1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const handleDelteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/deleteproject/${projectId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        alert("Project deleted successfully");
        setProjects((prev) => prev.filter((proj) => proj._id !== projectId));
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again later.");
    }
  };

  const handleApplicantStatus = async (id, status) => {
    try {
      // Update backend
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/applicant/${id}`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update Firebase for real-time updates
      const applicant = applicants.find(app => app._id === id);
      if (applicant) {
        const projectId = applicant.project_id?._id || applicant.project_id;
        const userId = applicant.user_id;
        
        // Update Firebase document
        const applicantStatusRef = doc(db, 'applicant_status', `${projectId}_${userId}`);
        await setDoc(applicantStatusRef, {
          projectId,
          userId,
          status,
          updatedAt: serverTimestamp(),
          applicantId: id
        }, { merge: true });

        // If status is "Accepted", create workspace access
        if (status === "Accepted") {
          await createWorkspaceAccess(projectId, userId);
        }
      }

      // Update local state
      setApplicants((prev) =>
        prev.map((app) =>
          app._id === id ? { ...app, bid_status: status } : app
        )
      );

      notificationService.success(`Applicant ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Error updating applicant status:", error);
      notificationService.error("Failed to update applicant status");
    }
  };

  // Create workspace access for selected contributors
  const createWorkspaceAccess = async (projectId, userId) => {
    try {
      // Create workspace access in Firebase
      const workspaceAccessRef = doc(db, 'workspace_access', `${projectId}_${userId}`);
      await setDoc(workspaceAccessRef, {
        projectId,
        userId,
        accessLevel: 'contributor',
        grantedAt: serverTimestamp(),
        status: 'active'
      }, { merge: true });

      // Update local workspace access state
      setWorkspaceAccess(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [userId]: {
            accessLevel: 'contributor',
            grantedAt: new Date(),
            status: 'active'
          }
        }
      }));

      console.log(`✅ Workspace access granted for user ${userId} on project ${projectId}`);
    } catch (error) {
      console.error("Error creating workspace access:", error);
    }
  };

  // Enhanced Project Selection Handlers
  const handleCreateSelection = async (projectId, selectionData) => {
    try {
      await projectSelectionApi.createSelection(projectId, selectionData);
      notificationService.success("Project selection created successfully");
      // Refresh data
      const data = await projectSelectionApi.getProjectOwnerSelections();
      setSelectionConfigs(prev => ({
        ...prev,
        [projectId]: selectionData
      }));
    } catch (error) {
      notificationService.error("Failed to create project selection");
    }
  };

  const handleExecuteSelection = async (projectId) => {
    try {
      setSelectionInProgress(prev => ({ ...prev, [projectId]: true }));
      
      // Execute automatic selection
      const result = await projectSelectionApi.executeAutomaticSelection(projectId);
      
      if (result.success) {
        // Update Firebase for real-time updates
        const selectionStatusRef = doc(db, 'selection_status', projectId);
        await setDoc(selectionStatusRef, {
          projectId,
          status: 'completed',
          selectedUsers: result.selectedUsers,
          completedAt: serverTimestamp(),
          totalBidders: result.totalBidders
        }, { merge: true });

        // Create workspace access for selected users
        if (result.selectedUsers && result.selectedUsers.length > 0) {
          for (const selectedUser of result.selectedUsers) {
            await createWorkspaceAccess(projectId, selectedUser.userId);
          }
        }

        notificationService.success(`Automatic selection completed! ${result.selectedUsers?.length || 0} contributors selected.`);
      } else {
        notificationService.error(result.message || "Automatic selection failed");
      }
      
      // Refresh data
      const [applicantsRes, selectionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/applicant`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        projectSelectionApi.getProjectOwnerSelections()
      ]);
      
      const applicants = applicantsRes.data.applicants || [];
      const selections = selectionsRes.selections || [];
      
      // Update grouped applicants
      const groupedApplicants = {};
      applicants.forEach(applicant => {
        const projectId = applicant.project_id?._id || applicant.project_id;
        if (!groupedApplicants[projectId]) {
          groupedApplicants[projectId] = [];
        }
        groupedApplicants[projectId].push(applicant);
      });
      
      setApplicantsByProject(groupedApplicants);
      setApplicants(applicants);
    } catch (error) {
      console.error("Error executing automatic selection:", error);
      notificationService.error("Failed to execute selection: " + (error.message || "Unknown error"));
    } finally {
      setSelectionInProgress(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleGetRankedBidders = async (projectId) => {
    try {
      const data = await projectSelectionApi.getRankedBidders(projectId);
      setRankedBidders(prev => ({
        ...prev,
        [projectId]: data.rankedBidders
      }));
    } catch (error) {
      notificationService.error("Failed to get ranked bidders");
    }
  };

  const handleManualSelection = async (projectId, selectedUserIds) => {
    try {
      const result = await projectSelectionApi.manualSelection(projectId, selectedUserIds, "manual_selection");
      
      if (result.success) {
        // Update Firebase for real-time updates
        const selectionStatusRef = doc(db, 'selection_status', projectId);
        await setDoc(selectionStatusRef, {
          projectId,
          status: 'completed',
          selectedUsers: result.selectedUsers,
          completedAt: serverTimestamp(),
          totalBidders: selectedUserIds.length
        }, { merge: true });

        // Create workspace access for selected users
        for (const userId of selectedUserIds) {
          await createWorkspaceAccess(projectId, userId);
        }

        notificationService.success(`Manual selection completed! ${selectedUserIds.length} contributors selected.`);
      } else {
        notificationService.error(result.message || "Manual selection failed");
      }
      
      // Refresh data
      const [applicantsRes, selectionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/applicant`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        projectSelectionApi.getProjectOwnerSelections()
      ]);
      
      const applicants = applicantsRes.data.applicants || [];
      const selections = selectionsRes.selections || [];
      
      // Update grouped applicants
      const groupedApplicants = {};
      applicants.forEach(applicant => {
        const projectId = applicant.project_id?._id || applicant.project_id;
        if (!groupedApplicants[projectId]) {
          groupedApplicants[projectId] = [];
        }
        groupedApplicants[projectId].push(applicant);
      });
      
      setApplicantsByProject(groupedApplicants);
      setApplicants(applicants);
    } catch (error) {
      console.error("Error completing manual selection:", error);
      notificationService.error("Failed to complete manual selection: " + (error.message || "Unknown error"));
    }
  };

  // Escrow Wallet Handlers
  const handleCreateEscrow = async (projectId, bonusPoolAmount) => {
    try {
      await escrowWalletApi.createEscrowWallet(projectId, bonusPoolAmount);
      notificationService.success("Escrow wallet created successfully");
      // Refresh escrow data
      const [escrowData, statsData] = await Promise.all([
        escrowWalletApi.getProjectOwnerEscrows(),
        escrowWalletApi.getEscrowStats()
      ]);
      setEscrowWallets(escrowData.escrowWallets || []);
      setEscrowStats(statsData.statistics);
    } catch (error) {
      notificationService.error("Failed to create escrow wallet");
    }
  };

  const handleCompleteProject = async (projectId) => {
    try {
      await escrowWalletApi.completeProject(projectId, "Project completed via admin panel", 8);
      notificationService.success("Project completed and funds released");
      // Refresh escrow data
      const [escrowData, statsData] = await Promise.all([
        escrowWalletApi.getProjectOwnerEscrows(),
        escrowWalletApi.getEscrowStats()
      ]);
      setEscrowWallets(escrowData.escrowWallets || []);
      setEscrowStats(statsData.statistics);
    } catch (error) {
      notificationService.error("Failed to complete project");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e]">
      <Navbar />
      {/* Sidebar */}
      <aside className="w-64 bg-[#181b23] text-white flex flex-col p-6 border-r border-blue-500/20 shadow-lg">
        <h2 className="text-3xl font-extrabold mb-10 text-blue-400 tracking-wide">
          DevHubs Admin
        </h2>
        <nav className="flex flex-col gap-3">
          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "dashboard"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "projects"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("projects")}
          >
            My Projects
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "applicants"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("applicants")}
          >
            Applicants
          </button>

          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "contribution"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("contribution")}
          >
            Project Management 
          </button>



          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "escrow"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("escrow")}
          >
            <FaWallet className="inline mr-2" />
            Escrow Management
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Dashboard Section */}
        {view === "dashboard" && (
          <section>
            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-2 text-blue-400">
                Welcome, Admin!
              </h1>
              <p className="text-gray-300 text-lg">
                Here’s a quick overview of your DevHubs platform activity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              <div className="bg-gradient-to-br from-blue-900/60 to-blue-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaProjectDiagram className="text-4xl text-blue-400 mb-3" />
                <div className="text-3xl font-extrabold text-blue-400">
                  {loading ? "..." : totalProjects}
                </div>
                <div className="mt-2 text-gray-300">Total Projects</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/60 to-green-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaCheckCircle className="text-4xl text-green-400 mb-3" />
                <div className="text-3xl font-extrabold text-green-400">
                  {loading ? "..." : openProjects}
                </div>
                <div className="mt-2 text-gray-300">Open Projects</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/60 to-red-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaTimesCircle className="text-4xl text-red-400 mb-3" />
                <div className="text-3xl font-extrabold text-red-400">
                  {loading ? "..." : closedProjects}
                </div>
                <div className="mt-2 text-gray-300">Closed Projects</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/60 to-purple-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaUsers className="text-4xl text-purple-400 mb-3" />
                <div className="text-3xl font-extrabold text-purple-400">
                  {loading ? "..." : totalApplicants}
                </div>
                <div className="mt-2 text-gray-300">Total Applicants</div>
              </div>
            </div>
            <div className="relative bg-[#181b23]/80 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-10 border border-blue-500/10 flex flex-col items-center overflow-hidden mt-8 w-full max-w-3xl mx-auto">
              {/* Subtle animated background gradient */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="w-full h-full bg-gradient-to-tr from-blue-900/20 via-purple-900/10 to-yellow-700/10 blur-2xl animate-pulse"></div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 z-10 tracking-wide drop-shadow">
                Platform Overview
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 rounded-full mb-6 z-10"></div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 z-10 w-full">
                <div className="w-44 h-44 md:w-60 md:h-60 flex items-center justify-center bg-[#232a34]/80 rounded-xl shadow-lg border border-blue-500/10">
                  <Doughnut
                    data={chartData}
                    options={{
                      plugins: { legend: { display: false } },
                      cutout: "75%",
                      animation: { animateRotate: true, animateScale: true },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
                {/* Modern Legend */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {chartData.labels.map((label, idx) => (
                    <div
                      key={label}
                      className="flex items-center justify-between bg-[#232a34]/70 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              chartData.datasets[0].backgroundColor[idx],
                            boxShadow:
                              "0 0 6px 0 " +
                              chartData.datasets[0].backgroundColor[idx],
                          }}
                        ></span>
                        <span className="text-sm md:text-base font-medium text-gray-200">
                          {label}
                        </span>
                      </div>
                      <span className="text-base md:text-lg font-bold text-blue-200">
                        {chartData.datasets[0].data[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects Section */}

        {view === "projects" && (
          <section>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-blue-400">
                My Projects
              </h1>
              <p className="text-gray-300 text-lg">
                Manage your projects and access selection & escrow systems
              </p>
            </div>

            {/* Quick Actions for Projects */}
            <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10 mb-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setView("selection")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FaUserCog />
                  Project Selection
                </button>
                <button
                  onClick={() => setView("escrow")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FaWallet />
                  Escrow Management
                </button>
                <Link to="/listproject" className="block">
                  <button className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2">
                    <FaProjectDiagram />
                    Create New Project
                  </button>
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FaChartLine />
                  Refresh Data
                </button>
              </div>
            </div>
            {projectsLoading ? (
              <div className="text-blue-300 text-lg">Loading projects...</div>
            ) : projectsError ? (
              <div className="text-red-400 text-lg">{projectsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-[#232a34] rounded-2xl shadow-lg border border-blue-500/10">
                  <thead>
                    <tr className="text-blue-300 text-lg">
                      <th className="p-4 text-left">Project Name</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Applicants</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj) => (
                      <tr
                        key={proj._id}
                        className="border-t border-blue-500/10 hover:bg-blue-500/5 transition"
                      >
                        <td className="p-4 font-semibold text-white">
                          {proj.project_Title ||
                            proj.Project_Title ||
                            proj.Project_Description ||
                            "Untitled"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              statusColors[
                                proj.status || proj.Project_Status
                              ] || "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {proj.status || proj.Project_Status || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-blue-300">
                          {proj.bids
                            ? proj.bids.length
                            : proj.Project_Number_Of_Bids || 0}
                        </td>
                        <td className="p-4 flex gap-2 flex-wrap">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs"
                            onClick={() => setSelectedProject(proj)}
                          >
                            <FaUsers /> View
                          </button>
                          <Link to={`/editproject/${proj._id}`}>
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs">
                              <FaEdit /> Edit
                            </button>
                          </Link>
                          <Link to={`/project-selection/${proj._id}`}>
                            <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs">
                              <FaUserCog /> Selection
                            </button>
                          </Link>
                          <Link to={`/escrow-wallet/${proj._id}`}>
                            <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs">
                              <FaWallet /> Escrow
                            </button>
                          </Link>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs"
                            onClick={() => handleDelteProject(proj._id)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedProject && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-2xl border border-blue-500/20 shadow-2xl relative">
                  <h2 className="text-2xl font-bold mb-6 text-blue-400 text-center">
                    Applicants for{" "}
                    {selectedProject.project_Title ||
                      selectedProject.Project_Title}
                  </h2>
                  <ul className="space-y-8 max-h-[70vh] overflow-y-auto">
                    {selectedProject.bids && selectedProject.bids.length > 0 ? (
                      selectedProject.bids.map((a, idx) => (
                        <li
                          key={a._id || idx}
                          className="bg-[#181b23] rounded-xl p-6 flex flex-col md:flex-row gap-6 shadow border border-blue-500/10"
                        >
                          {/* Profile Picture & Social */}
                          <div className="flex-shrink-0 flex flex-col items-center md:items-start w-40">
                            <img
                              src={
                                a.bidderProfile?.user_profile_cover_photo
                                  ? a.bidderProfile.user_profile_cover_photo
                                  : "https://ui-avatars.com/api/?name=" +
                                    (a.bidderProfile?.username || "User")
                              }
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 mb-3"
                            />
                            <span className="text-xs text-gray-400 mb-2">
                              {a.bidderProfile?.user_profile_location ||
                                "Unknown"}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {a.bidderProfile?.user_profile_github && (
                                <a
                                  href={a.bidderProfile.user_profile_github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-gray-800 px-2 py-1 rounded hover:underline"
                                >
                                  GitHub
                                </a>
                              )}
                              {a.bidderProfile?.user_profile_linkedIn && (
                                <a
                                  href={a.bidderProfile.user_profile_linkedIn}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-blue-800 px-2 py-1 rounded hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {a.bidderProfile?.user_profile_website && (
                                <a
                                  href={a.bidderProfile.user_profile_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-green-800 px-2 py-1 rounded hover:underline"
                                >
                                  Website
                                </a>
                              )}
                              {a.bidderProfile?.user_profile_instagram && (
                                <a
                                  href={a.bidderProfile.user_profile_instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-pink-800 px-2 py-1 rounded hover:underline"
                                >
                                  Instagram
                                </a>
                              )}
                            </div>
                          </div>
                          {/* Profile & Bid Details */}
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Username & Status */}
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className="text-xl font-bold text-white">
                                {a.bidderProfile?.username || "Unknown"}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded font-semibold ${
                                  statusColors[a.bid_status] ||
                                  "bg-gray-700 text-gray-300"
                                }`}
                              >
                                {a.bid_status || "Applied"}
                              </span>
                            </div>
                            {/* Profile Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Email:{" "}
                                </span>
                                <span className="text-gray-200 break-all">
                                  {a.bidderProfile?.user_profile_email || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Profile Created:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bidderProfile?.user_profile_created_at
                                    ? new Date(
                                        a.bidderProfile.user_profile_created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Experience:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.year_of_experience || "N/A"} yrs
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Hours/Week:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.hours_avilable_per_week || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Projects Done:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bidderProfile?.user_completed_projects ??
                                    "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Contributions:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bidderProfile?.user_project_contribution ??
                                    "N/A"}
                                </span>
                              </div>
                            </div>
                            {/* Skills & Bio */}
                            <div>
                              <span className="font-semibold text-gray-300">
                                Skills:{" "}
                              </span>
                              <span className="text-blue-200">
                                {a.bidderProfile?.user_profile_skills?.join(
                                  ", "
                                ) || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-300">
                                Bio:{" "}
                              </span>
                              <span className="text-gray-200">
                                {a.bidderProfile?.user_profile_bio || "N/A"}
                              </span>
                            </div>
                            {/* Bid Proposal */}
                            <div className="mt-2 p-4 rounded-xl bg-[#232a34] border border-blue-500/10">
                              <div className="flex flex-wrap gap-4 items-center mb-2">
                                <span className="font-semibold text-yellow-300">
                                  Bid Amount:{" "}
                                  <span className="text-white">
                                    ₹{a.bid_amount}
                                  </span>
                                </span>
                                <span className="font-semibold text-blue-300">
                                  Proposal Date:{" "}
                                  <span className="text-white">
                                    {a.created_at
                                      ? new Date(
                                          a.created_at
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Proposal Description:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bid_description}
                                </span>
                              </div>
                              {/* Extra: Show skills from bid if present */}
                              {a.skills && a.skills.length > 0 && (
                                <div className="mt-2">
                                  <span className="font-semibold text-gray-300">
                                    Bid Skills:{" "}
                                  </span>
                                  <span className="text-blue-200">
                                    {a.skills.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No applicants yet.</li>
                    )}
                  </ul>
                  <button
                    className="mt-8 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition w-full"
                    onClick={() => setSelectedProject(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {view === "applicants" && (
          <section>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-blue-400">
                Project Applicants & Selection
              </h1>
              <p className="text-gray-300 text-lg">
                Review applicants and select contributors using manual or automatic selection
              </p>
            </div>

            {/* Selection Mode Toggle */}
            <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10 mb-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Selection Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#181b23] rounded-xl p-4 border border-blue-500/10">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <FaUserCheck className="text-green-400" />
                    Manual Selection
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Review each applicant individually and select based on your judgment
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Review detailed profiles and proposals</li>
                    <li>• Compare skills and experience</li>
                    <li>• Make informed decisions</li>
                  </ul>
                </div>
                <div className="bg-[#181b23] rounded-xl p-4 border border-blue-500/10">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <FaCog className="text-blue-400" />
                    Automatic Selection
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Use AI algorithm to rank and select the best contributors automatically
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Priority-based scoring algorithm</li>
                    <li>• Skill matching and bid amount priority</li>
                    <li>• Experience and availability scoring</li>
                  </ul>
                </div>
              </div>
            </div>

            {applicantsLoading ? (
              <div className="text-blue-300 text-lg">Loading applicants and selection data...</div>
            ) : applicantsError ? (
              <div className="text-red-400 text-lg">{applicantsError}</div>
            ) : (
              <div className="space-y-6">
                {Object.keys(applicantsByProject).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-[#232a34] rounded-xl">
                    <FaUsers className="text-4xl mx-auto mb-4" />
                    <p>No applicants found.</p>
                    <p className="text-sm">Applicants will appear here when they bid on your projects.</p>
                  </div>
                ) : (
                  Object.entries(applicantsByProject).map(([projectId, projectApplicants]) => {
                    const project = projectApplicants[0]?.project_id;
                    const selectionConfig = selectionConfigs[projectId];
                    const isSelectionInProgress = selectionInProgress[projectId];
                    const projectRankedBidders = rankedBidders[projectId];
                    
                    return (
                      <div key={projectId} className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10">
                        {/* Project Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {project?.project_Title || "Untitled Project"}
                            </h3>
                            <p className="text-gray-300 text-sm">
                              {projectApplicants.length} applicants • 
                              {selectionConfig ? ` Selection: ${selectionConfig.status}` : " No selection config"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!selectionConfig && (
                              <button
                                onClick={() => {
                                  setSelectedProjectForConfig(projectId);
                                  setShowSelectionConfigModal(true);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                              >
                                <FaCog />
                                Configure Selection
                              </button>
                            )}
                            {selectionConfig && selectionConfig.status === 'pending' && (
                              <button
                                onClick={() => handleGetRankedBidders(projectId)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                              >
                                <FaChartLine />
                                View Rankings
                              </button>
                            )}
                            {selectionConfig && selectionConfig.status === 'pending' && (
                              <button
                                onClick={() => handleExecuteSelection(projectId)}
                                disabled={isSelectionInProgress}
                                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                              >
                                {isSelectionInProgress ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FaUserCheck />
                                    Execute Selection
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Selection Configuration Display */}
                        {selectionConfig && (
                          <div className="bg-[#181b23] rounded-xl p-4 mb-4 border border-blue-500/10">
                            <h4 className="text-lg font-semibold text-blue-400 mb-2">Selection Configuration</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Mode:</span>
                                <span className="text-white ml-2 capitalize">{selectionConfig.selectionMode}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Required:</span>
                                <span className="text-white ml-2">{selectionConfig.requiredContributors} contributors</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                                  selectionConfig.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                                  selectionConfig.status === 'in_progress' ? 'bg-blue-900/40 text-blue-400' :
                                  'bg-yellow-900/40 text-yellow-400'
                                }`}>
                                  {selectionConfig.status?.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Selected:</span>
                                <span className="text-white ml-2">{selectionConfig.selectedUsers?.length || 0} users</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Ranked Bidders Display */}
                        {projectRankedBidders && (
                          <div className="bg-[#181b23] rounded-xl p-4 mb-4 border border-green-500/10">
                            <h4 className="text-lg font-semibold text-green-400 mb-2">AI Ranking Results</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {projectRankedBidders.slice(0, 5).map((bidder, index) => (
                                <div key={bidder.userId} className="flex items-center justify-between bg-[#232a34] rounded-lg p-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-yellow-400 font-bold">#{index + 1}</span>
                                    <span className="text-white font-medium">{bidder.username}</span>
                                    <span className="text-blue-300">₹{bidder.bidAmount}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-bold">{Math.round(bidder.scores.totalScore)}</span>
                                    <span className="text-gray-400 text-xs">points</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => {
                                  const topUserIds = projectRankedBidders
                                    .slice(0, selectionConfig?.requiredContributors || 3)
                                    .map(bidder => bidder.userId);
                                  handleManualSelection(projectId, topUserIds);
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition text-xs"
                              >
                                Select Top Ranked
                              </button>
                              <button
                                onClick={() => setRankedBidders(prev => ({ ...prev, [projectId]: null }))}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition text-xs"
                              >
                                Hide Rankings
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Applicants Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {projectApplicants.map((app) => (
                            <div
                              key={app._id}
                              className="bg-[#181b23] rounded-xl p-4 border border-blue-500/10 hover:border-blue-400 transition"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                                    {app.user_id || "User ID"}
                                  </div>
                                  <div className="text-base font-semibold text-white break-all">
                                    {app.user_id || "N/A"}
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    statusColors[app.bid_status] ||
                                    "bg-gray-700 text-gray-300"
                                  }`}
                                >
                                  {app.bid_status || "Applied"}
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Bid Amount:</span>
                                  <span className="text-yellow-200 font-semibold">₹{app.bid_amount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Experience:</span>
                                  <span className="text-blue-200">{app.year_of_experience || "N/A"} yrs</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Hours/Week:</span>
                                  <span className="text-blue-200">{app.hours_avilable_per_week || "N/A"}</span>
                                </div>
                              </div>

                              <div className="mt-3">
                                <div className="text-xs text-gray-400 mb-1">Skills:</div>
                                <div className="flex flex-wrap gap-1">
                                  {app.skills?.length ? 
                                    app.skills.slice(0, 3).map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded text-xs"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                    : "N/A"
                                  }
                                  {app.skills?.length > 3 && (
                                    <span className="text-gray-400 text-xs">+{app.skills.length - 3} more</span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 flex gap-2">
                                <button
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition flex items-center gap-1 text-xs"
                                  onClick={() => handleApplicantStatus(app._id, "Accepted")}
                                  disabled={app.bid_status === "Accepted"}
                                >
                                  <FaUserCheck /> Accept
                                </button>
                                <button
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg transition flex items-center gap-1 text-xs"
                                  onClick={() => handleApplicantStatus(app._id, "Rejected")}
                                  disabled={app.bid_status === "Rejected"}
                                >
                                  <FaUserTimes /> Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        )}

        {/* Admin Contribution Board Section */}
        {view === "contribution" && (
          <section>
            <AdminContributionBoard
              tasks={adminTasks}
              chat={adminChat}
              mentor={adminMentor}
              notes={adminNotes}
              onTaskStatusChange={handleAdminTaskStatusChange}
              onSendMessage={handleAdminSendMessage}
              onNotesChange={handleAdminNotesChange}
            />
          </section>
        )}



        {/* Escrow Management System Section */}
        {view === "escrow" && (
          <section>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-blue-400">
                Escrow Wallet Management
              </h1>
              <p className="text-gray-300 text-lg">
                Manage project funds, payments, and escrow wallets
              </p>
            </div>

            {escrowLoading ? (
              <div className="text-blue-300 text-lg">Loading escrow data...</div>
            ) : escrowError ? (
              <div className="text-red-400 text-lg">{escrowError}</div>
            ) : (
              <div className="space-y-6">
                {/* Escrow Statistics */}
                {escrowStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-900/60 to-blue-700/40 rounded-2xl shadow-lg p-6 text-center border border-blue-500/10">
                      <FaWallet className="text-3xl text-blue-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-blue-400">
                        {escrowStats.totalWallets || 0}
                      </div>
                      <div className="text-gray-300">Total Wallets</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/60 to-green-700/40 rounded-2xl shadow-lg p-6 text-center border border-blue-500/10">
                      <FaMoneyBillWave className="text-3xl text-green-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-green-400">
                        ₹{escrowStats.totalLockedFunds || 0}
                      </div>
                      <div className="text-gray-300">Locked Funds</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/60 to-purple-700/40 rounded-2xl shadow-lg p-6 text-center border border-blue-500/10">
                      <FaShieldAlt className="text-3xl text-purple-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-purple-400">
                        ₹{escrowStats.totalBonusPool || 0}
                      </div>
                      <div className="text-gray-300">Bonus Pool</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-900/60 to-yellow-700/40 rounded-2xl shadow-lg p-6 text-center border border-blue-500/10">
                      <FaCheckCircle className="text-3xl text-yellow-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-yellow-400">
                        {escrowStats.completedProjects || 0}
                      </div>
                      <div className="text-gray-300">Completed</div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowEscrowModal(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FaWallet />
                      Create Escrow Wallet
                    </button>
                    <Link to="/escrow-wallet/new" className="block">
                      <button className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2">
                        <FaShieldAlt />
                        Advanced Management
                      </button>
                    </Link>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FaChartLine />
                      Refresh Data
                    </button>
                  </div>
                </div>

                {/* Escrow Wallets List */}
                <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">Active Escrow Wallets</h2>
                  {escrowWallets.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FaWallet className="text-4xl mx-auto mb-4" />
                      <p>No escrow wallets found.</p>
                      <p className="text-sm">Create a new escrow wallet to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {escrowWallets.map((wallet) => (
                        <div
                          key={wallet._id}
                          className="bg-[#181b23] rounded-xl p-6 border border-blue-500/10 hover:border-blue-400 transition"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                              {wallet.projectId?.project_Title || "Untitled Project"}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              wallet.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                              wallet.status === 'active' ? 'bg-blue-900/40 text-blue-400' :
                              'bg-yellow-900/40 text-yellow-400'
                            }`}>
                              {wallet.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-300">
                            <div>
                              <span className="font-semibold">Bonus Pool:</span> ₹{wallet.totalBonusPool}
                            </div>
                            <div>
                              <span className="font-semibold">Locked Funds:</span> ₹{wallet.totalEscrowAmount || 0}
                            </div>
                            <div>
                              <span className="font-semibold">Contributors:</span> {wallet.bonusPoolDistribution?.totalContributors || 0}
                            </div>
                            <div>
                              <span className="font-semibold">Per Contributor:</span> ₹{wallet.bonusPoolDistribution?.amountPerContributor || 0}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Link to={`/escrow-wallet/${wallet.projectId}`}>
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition text-xs">
                                Manage
                              </button>
                            </Link>
                            {wallet.status === 'active' && (
                              <button
                                onClick={() => handleCompleteProject(wallet.projectId)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition text-xs"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}



        {/* Selection Configuration Modal */}
        {showSelectionConfigModal && selectedProjectForConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-blue-400 text-center">
                Configure Project Selection
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectionData = {
                  selectionMode: formData.get('selectionMode'),
                  requiredContributors: parseInt(formData.get('requiredContributors')),
                  maxBidsToConsider: parseInt(formData.get('maxBidsToConsider')),
                  criteriaWeights: {
                    skillMatch: parseFloat(formData.get('skillMatch')),
                    bidAmount: parseFloat(formData.get('bidAmount')),
                    experience: parseFloat(formData.get('experience')),
                    availability: parseFloat(formData.get('availability'))
                  }
                };
                handleCreateSelection(selectedProjectForConfig, selectionData);
                setShowSelectionConfigModal(false);
                setSelectedProjectForConfig(null);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Selection Mode
                    </label>
                    <select
                      name="selectionMode"
                      required
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="automatic">Automatic (AI Algorithm)</option>
                      <option value="manual">Manual (Owner Choice)</option>
                      <option value="hybrid">Hybrid (AI + Manual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Required Contributors
                    </label>
                    <input
                      type="number"
                      name="requiredContributors"
                      required
                      min="1"
                      max="50"
                      defaultValue="3"
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Bids to Consider
                    </label>
                    <input
                      type="number"
                      name="maxBidsToConsider"
                      required
                      min="1"
                      max="200"
                      defaultValue="50"
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Skill Match Weight
                      </label>
                      <input
                        type="number"
                        name="skillMatch"
                        required
                        min="0"
                        max="100"
                        step="5"
                        defaultValue="40"
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bid Amount Weight
                      </label>
                      <input
                        type="number"
                        name="bidAmount"
                        required
                        min="0"
                        max="100"
                        step="5"
                        defaultValue="30"
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Experience Weight
                      </label>
                      <input
                        type="number"
                        name="experience"
                        required
                        min="0"
                        max="100"
                        step="5"
                        defaultValue="20"
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Availability Weight
                      </label>
                      <input
                        type="number"
                        name="availability"
                        required
                        min="0"
                        max="100"
                        step="5"
                        defaultValue="10"
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Create Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSelectionConfigModal(false);
                      setSelectedProjectForConfig(null);
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Escrow Modal */}
        {showEscrowModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-blue-400 text-center">
                Create Escrow Wallet
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const projectId = formData.get('projectId');
                const bonusPoolAmount = parseFloat(formData.get('bonusPoolAmount'));
                handleCreateEscrow(projectId, bonusPoolAmount);
                setShowEscrowModal(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project ID
                    </label>
                    <input
                      type="text"
                      name="projectId"
                      required
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="Enter project ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bonus Pool Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="bonusPoolAmount"
                      required
                      min="0"
                      step="0.01"
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="Enter bonus pool amount"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Create Escrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEscrowModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
