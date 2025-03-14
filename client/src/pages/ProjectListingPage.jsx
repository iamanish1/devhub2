import Navbar from "../components/NavBar";
const ProjectListingPage = ()=>{
    return (
        <>
        {/* Nav-bar */}
        <Navbar/>
        {/* Main Section (Now Scrollable) */}
      <main className="w-full min-h-screen flex flex-col items-center bg-[#121212] p-4 overflow-auto">
        {/* Bidding Page Container */}
        <section className="w-full max-w-[90vw] bg-[#1a1a1a] text-white rounded-lg shadow-lg p-6">
          <div className="flex justify-center items-center">
          <h1 className="text-3xl font-bold uppercase">List Your Project</h1>
          </div>
          {/* UnderLine */}
          <div className="w-full h-0.5 bg-gray-300 my-2" />
          {/* Form - section for project listing */}
          <section className="flex flex-col">
            <form action="">
                <div className="py-2">
                    <label>Project Title:</label>
                    <input type="text" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none mt-[2vmin]"
                    placeholder="Enter your Project Title..." />
                </div>
                <div className="py-2">
                    <label>Bid Amount:</label>
                    <input type="text" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]"
                    placeholder="Enter your Project Bid Amount..." />
                </div>
                <div className="py-2">
                    <label>Number of Contributors:</label>
                    <input type="number" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]"
                    placeholder="Enter The number of contributor you want..." />
                </div>
                <div className="py-2">
                    <label>Number of total Bid:</label>
                    <input type="number" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]"
                    placeholder="Enter number of bids you want for project..." />
                </div>
                <div className="py-2">
                    <label>Description:</label>
                    <textarea className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]"
                    placeholder="Enter your project overview..." rows="7" />
                </div>
                <div className="py-2">
                  <label className="text-white">Technology Stack</label>
                <select className="border border-white h-[6vmin] w-[45vmin] text-white bg-[#1E1E1E] overflow-y-hidden scrollbar-hide  mt-[2vmin]">
                  <option>All</option>
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
              <div className="py-2">
                    <label>Features of your project : </label>
                    <textarea className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]"
                    placeholder="Describe About the feature of the project..." rows="5" />
                </div>
                <div className="py-2">
                    <label>Looking For  : </label>
                    <textarea className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]"
                    placeholder="Enter what type of people are you looking..." rows="5" />
                </div>
                <div className="py-2">
                    <label>Duration : </label>
                    <input type="date" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none" />
                </div>
                <div className="py-2">
                    <label>Github Repositorie Link : </label>
                    <input type="url" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none"
                     placeholder="Enter your repositorie link here..." />
                </div>
                <div className="py-2">
                  <label>Upload cover image :</label>
                  <input type="file" className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none  mt-[2vmin]" />
                </div>
                <div className="flex justify-center items-center gap-[10vmin] mt-[10vmin]">
                  <button className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[70vmin]">
                   Upload Project
                  </button>
                </div>

            </form>
          </section>
        </section>
      </main>
        </>
    )
}; 

export default ProjectListingPage;