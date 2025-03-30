import Navbar from "../components/NavBar";
import { useState } from "react";

const ProjectListingPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    bidAmount: "",
    contributors: "",
    totalBids: "",
    description: "",
    techStack: "",
    features: "",
    lookingFor: "",
    duration: "",
    githubLink: ""
  });

  const [coverImage, setCoverImage] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData, coverImage);
    // Add your submission logic here
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
            <p className="text-gray-400 text-center mt-2">Share your vision and find the perfect team</p>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-[#00A8E8]">{Math.round((currentStep/totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-[#0062E6] to-[#00A8E8] h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${(currentStep/totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 text-white">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-semibold text-[#00A8E8] mb-4">Project Basics</h2>
                
                <div className="form-group">
                  <label className="block text-gray-300 mb-2">Project Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="Enter a catchy title for your project..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">Bid Amount ($)</label>
                    <input
                      type="text"
                      name="bidAmount"
                      value={formData.bidAmount}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                      placeholder="Enter your project budget..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">Duration</label>
                    <input
                      type="date"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">Number of Contributors</label>
                    <input
                      type="number"
                      name="contributors"
                      value={formData.contributors}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                      placeholder="How many people do you need?"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-gray-300 mb-2">Number of Total Bids</label>
                    <input
                      type="number"
                      name="totalBids"
                      value={formData.totalBids}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                      placeholder="Maximum bids to accept..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-gray-300 mb-2">Technology Stack</label>
                  <select
                    name="techStack"
                    value={formData.techStack}
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
                <h2 className="text-xl font-semibold text-[#00A8E8] mb-4">Project Details</h2>
                
                <div className="form-group">
                  <label className="block text-gray-300 mb-2">Project Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="Provide a detailed overview of your project..."
                    rows="5"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-300 mb-2">Project Features</label>
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="List the key features of your project..."
                    rows="4"
                  ></textarea>
                  <p className="text-xs text-gray-400 mt-1">Tip: Use bullet points for better readability</p>
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-300 mb-2">What kind of people are you looking for?</label>
                  <textarea
                    name="lookingFor"
                    value={formData.lookingFor}
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
                <h2 className="text-xl font-semibold text-[#00A8E8] mb-4">Additional Information</h2>
                
                <div className="form-group">
                  <label className="block text-gray-300 mb-2">GitHub Repository Link</label>
                  <input
                    type="url"
                    name="githubLink"
                    value={formData.githubLink}
                    onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                    placeholder="https://github.com/yourusername/your-repo"
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-300 mb-2">Upload Cover Image</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-[#00A8E8] transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cover-image"
                      accept="image/*"
                    />
                    <label htmlFor="cover-image" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p className="mt-2 text-sm text-gray-400">
                          {coverImage ? coverImage.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG or GIF (Max. 2MB)</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Important Information
                    </h3>
                    <p className="text-sm text-gray-400">By submitting this project, you agree to our terms and conditions. Your project will be reviewed before going live.</p>
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
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
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
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white rounded-lg hover:from-[#00A8E8] hover:to-[#0062E6] transition-all shadow-lg shadow-blue-500/20 flex items-center"
                >
                  Submit Project
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
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
