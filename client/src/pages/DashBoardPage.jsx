import Navbar from "../components/NavBar";
import ProjectCard from "../components/ProjectCard";
const DashboardPage = () => {
  return (
    <>
      {/* Nav-bar */}
      <Navbar />
      {/* Explore project section with Filter and Search bar  */}
      <div>
        <main className="flex h-screen">
          <section className="w-[50vmin] bg-[#1E1E1E] p-4 h-screen">
            {/* Filter-Section Heading */}
            <section className="flex justify-center">
              <h1 className="text-white text-[2.5vmin] font-semibold mb-[3vmin]">
                Filter Projects
              </h1>
            </section>
            {/* Under Line */}
            <div className="border border-white w-[90vmin] h-[0.3vmin] bg-white"></div>
            {/* Filter by Teach - stack Drop-Down */}
            <section>
              <div className="flex items-center gap-[2vmin] flex-col mt-[3vmin]">
                <div className="">
                  <label className="text-white">Technology Stack</label>
                </div>
                <select className="border border-white h-[6vmin] w-[45vmin] text-white bg-[#1E1E1E] overflow-y-hidden scrollbar-hide">
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
            </section>
            {/* Filter by Budget Range Drop- Down */}
            <section>
              <div className="flex items-center gap-[2vmin] flex-col mt-[3vmin]">
                <div className="">
                  <label className="text-white">Project Budget</label>
                </div>
                <select className="border border-white h-[6vmin] w-[45vmin] text-white bg-[#1E1E1E] overflow-y-hidden scrollbar-hide">
                  <option>Above 1k</option>
                  <option>Between 1k-10k</option>
                  <option>Between 10k-50k</option>
                  <option>Above 50k</option>
                </select>
              </div>
            </section>
            {/* Filter by experienced level of Developer  */}
            <section>
              <div className="flex items-center gap-[2vmin] flex-col mt-[3vmin]">
                <div className="">
                  <label className="text-white">Experienced Level</label>
                </div>
                <select className="border border-white h-[6vmin] w-[45vmin] text-white bg-[#1E1E1E] overflow-y-hidden scrollbar-hide">
                  <option>Fresher Developer</option>
                  <option>Junior Developer</option>
                  <option>Senior Developer</option>
                </select>
              </div>
            </section>
            {/* Apply Filter Button*/}
            <section className="flex justify-center items-center">
              <button className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[45vmin] mt-[5vmin]">
                Apply Filter
              </button>
            </section>
          </section>
          <section className="flex-1 bg-[#121212] p-4 flex flex-col h-screen overflow-hidden">
            <h1 className="text-2xl font-bold text-[#FFFFFF] uppercase mb-[3vmin]">
              Explore Projects
            </h1>

            {/* Scrollable Project Cards Container */}
            <div className="project-container overflow-y-auto flex-1 w-full">
              {Array(16).fill(<ProjectCard />)}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default DashboardPage;
