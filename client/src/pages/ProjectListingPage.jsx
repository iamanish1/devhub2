/* eslint-disable no-unused-vars */
import Navbar from "../components/NavBar";
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUploadField from "../components/FileUploadField.jsx";

import axios from "axios";
const ProjectListingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const editingProject = location.state?.editingProject || null;
  const [formData, setFormData] = useState({
    project_Title: "",
    project_duration: "",
    Project_Bid_Amount: "",
    Project_Contributor: "",
    Project_Number_Of_Bids: "",
    Project_Description: "",
    Project_tech_stack: "",
    Project_Features: "",
    Project_looking: "",
    Project_gitHub_link: "",
    Project_cover_photo: "",
    project_starting_bid: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [coverImage, setCoverImage] = useState(null);
  const [projectImages, setProjectImages] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  useEffect(() => {
    if (!editingProject && params.id) {
      axios
        .get(`http://localhost:8000/api/project/getlistproject/${params.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          setFormData({
            ...formData,
            ...res.data.project,
          });
        })
        .catch(() => setError("Failed to load project for editing."));
    } else if (editingProject) {
      setFormData({
        ...formData,
        ...editingProject,
      });
    }
    // eslint-disable-next-line
  }, [editingProject, params.id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleFilesChange = (files, fieldName) => {
    switch (fieldName) {
      case "Project_cover_photo":
        setCoverImage(files[0] || null);
        break;
      case "Project_images":
        setProjectImages(files);
        break;
      default:
        break;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("project_Title", formData.project_Title);
      data.append("Project_Bid_Amount", formData.Project_Bid_Amount);
      data.append("project_starting_bid", formData.project_starting_bid);
      data.append("Project_Contributor", formData.Project_Contributor);
      data.append("Project_Number_Of_Bids", formData.Project_Number_Of_Bids);
      data.append("Project_Description", formData.Project_Description);
      data.append("Project_tech_stack", formData.Project_tech_stack);
      data.append("Project_Features", formData.Project_Features);
      data.append("Project_looking", formData.Project_looking);
      data.append("project_duration", formData.project_duration);
      data.append("Project_gitHub_link", formData.Project_gitHub_link);

      // Append cover image
      if (coverImage) {
        data.append("Project_cover_photo", coverImage);
      }

      // Append project images
      projectImages.forEach((file, index) => {
        data.append("Project_images", file);
      });

      let response;
      // Use params.id if editingProject is not available
      const projectId = editingProject?._id || params.id;
      for (let pair of data.entries()) {
        console.log(pair[0], pair[1]);
      }

      if (projectId) {
        const data = {
          project_Title: formData.project_Title,
          Project_Bid_Amount: formData.Project_Bid_Amount,
          project_starting_bid: formData.project_starting_bid,
          Project_Contributor: formData.Project_Contributor,
          Project_Number_Of_Bids: formData.Project_Number_Of_Bids,
          Project_Description: formData.Project_Description,
          Project_tech_stack: formData.Project_tech_stack,
          Project_Features: formData.Project_Features,
          Project_looking: formData.Project_looking,
          project_duration: formData.project_duration,
          Project_gitHub_link: formData.Project_gitHub_link,
        };
        // EDIT MODE
        response = await axios.put(
          `http://localhost:8000/api/admin/updateproject/${projectId}`,
          data,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        navigate("/admin");
        alert("Project updated successfully!");
      } else {
        // CREATE MODE
        console.log("project_Title", formData.project_Title);
        console.log("project_duration", formData.project_duration);
        console.log("project_starting_bid", formData.project_starting_bid);
        console.log("Project_Contributor", formData.Project_Contributor);
        console.log("Project_Number_Of_Bids", formData.Project_Number_Of_Bids);
        console.log("Project_Description", formData.Project_Description);
        console.log("Project_tech_stack", formData.Project_tech_stack);
        console.log("Project_Features", formData.Project_Features);
        console.log("Project_looking", formData.Project_looking);
        console.log("Project_gitHub_link", formData.Project_gitHub_link);

        // Use FormData for CREATE mode to handle file uploads
        response = await axios.post(
          "http://localhost:8000/api/project/listproject",
          data, // Use the FormData we created earlier
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              // Don't set Content-Type header - let browser set it for FormData
            },
          }
        );
        setFormData({
          project_Title: "",
          Project_Bid_Amount: "",
          Project_Contributor: "",
          Project_Number_Of_Bids: "",
          Project_Description: "",
          Project_tech_stack: "",
          Project_Features: "",
          Project_looking: "",
          project_duration: "",
          Project_gitHub_link: "",
          Project_cover_photo: null,
          project_starting_bid: "",
        });
        setCoverImage(null);
        setProjectImages([]);

        alert("Project submitted successfully!");
      }
      console.log("Project submitted:", response.data);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "An error occurred while submitting the form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Nav-bar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4 md:px-8 lg:px-16 overflow-auto">
        {/* Form Card */}
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-[#1a1a1a] to-[#232323] rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#1E1E1E] p-6 border-b border-gray-700">
            <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
              <span className="text-[#00A8E8]">List</span> Your Project
            </h1>
            <p className="text-gray-400 text-center mt-2">
              Share your vision and find the perfect team
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-[#00A8E8]">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-[#0062E6] to-[#00A8E8] h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 text-white">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-semibold text-[#00A8E8] mb-4">
                  Project Basics
                </h2>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    name="project_Title"
                    value={formData.project_Title}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="Enter a catchy title for your project..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">
                      Bid Amount ($)
                    </label>
                    <input
                      type="text"
                      name="project_starting_bid"
                      value={formData.project_starting_bid}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                      placeholder="Enter your project budget..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">Duration</label>
                    <input
                      type="date"
                      name="project_duration"
                      value={formData.project_duration}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">
                      Number of Contributors
                    </label>
                    <input
                      type="number"
                      name="Project_Contributor"
                      value={formData.Project_Contributor}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                      placeholder="How many people do you need?"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">
                      Number of Total Bids
                    </label>
                    <input
                      type="number"
                      name="Project_Number_Of_Bids"
                      value={formData.Project_Number_Of_Bids}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                      placeholder="Maximum bids to accept..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">
                    Technology Stack
                  </label>
                  <select
                    name="Project_tech_stack"
                    value={formData.Project_tech_stack}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                  >
                    <option value="">Select technology...</option>
                    <option>MERN Stack</option>
                    <option>MEAN Stack</option>
                    <option>MEVN Stack</option>
                    <option>Next.js</option>
                    <option>NestJS</option>
                    <option>Django</option>
                    <option>Flask</option>
                    <option>Spring Boot</option>
                    <option>ASP.NET</option>
                    <option>React Native</option>
                    <option>Flutter</option>
                    <option>Swift</option>
                    <option>Kotlin</option>
                    <option>TensorFlow</option>
                    <option>PyTorch</option>
                    <option>Apache Spark</option>
                    <option>Solidity</option>
                    <option>Rust</option>
                    <option>Docker</option>
                    <option>Kubernetes</option>
                    <option>AWS</option>
                    <option>GCP</option>
                    <option>MySQL</option>
                    <option>MongoDB</option>
                    <option>PostgreSQL</option>
                    <option>Firebase</option>
                    <option>Redis</option>
                    <option>Unity</option>
                    <option>Unreal Engine</option>
                    <option>IoT</option>
                    <option>C++</option>
                    <option>Go</option>
                    <option>Rust</option>
                    <option>Cybersecurity</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-semibold text-[#00A8E8] mb-4">
                  Project Details
                </h2>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">
                    Project Description
                  </label>
                  <textarea
                    name="Project_Description"
                    value={formData.Project_Description}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="Provide a detailed overview of your project..."
                    rows="5"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">
                    Project Features
                  </label>
                  <textarea
                    name="Project_Features"
                    value={formData.Project_Features}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="List the key features of your project..."
                    rows="4"
                  ></textarea>
                  <p className="text-xs text-gray-400 mt-1">
                    Tip: Use bullet points for better readability
                  </p>
                </div>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">
                    What kind of people are you looking for?
                  </label>
                  <textarea
                    name="Project_looking"
                    value={formData.Project_looking}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="Describe the ideal contributors for your project..."
                    rows="4"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-semibold text-[#00A8E8] mb-4">
                  Additional Information
                </h2>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">
                    GitHub Repository Link
                  </label>
                  <input
                    type="url"
                    name="Project_gitHub_link"
                    value={formData.Project_gitHub_link}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="https://github.com/yourusername/your-repo"
                  />
                </div>

                <FileUploadField
                  label="Upload Cover Image"
                  name="Project_cover_photo"
                  multiple={false}
                  accept="image/*"
                  maxSize={2}
                  onFilesChange={handleFilesChange}
                  showPreview={true}
                />

                <div className="form-group">
                  <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-[#00A8E8]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      Important Information
                    </h3>
                    <p className="text-sm text-gray-400">
                      By submitting this project, you agree to our terms and
                      conditions. Your project will be reviewed before going
                      live.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333] transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white rounded-lg hover:from-[#00A8E8] hover:to-[#0062E6] transition-all shadow-lg shadow-blue-500/20 flex items-center"
                >
                  Next
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white rounded-lg hover:from-[#00A8E8] hover:to-[#0062E6] transition-all shadow-lg shadow-blue-500/20 flex items-center"
                >
                  Submit Project
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProjectListingPage;
