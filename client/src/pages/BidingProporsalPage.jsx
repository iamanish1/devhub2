import Navbar from "../components/NavBar";
const BidingProporsalPage = ()=>{
    return(
        <>
        {/* Nav-bar */}
        <Navbar/>
       {/* Biding - proposal Form  */}
       <main className="flex justify-center items-center h-screen">
        <section className="w-auto px-[4vmin] h-full border border-white mt-[3vmin] mr-[4vmin] ml-[4vmin] ">
          {/* Biding Proporsal Heading */}
          <div className="flex justify-center items-center">
            <h1 className="text-3xl font-semibold text-white uppercase mt-[2.5vmin]"> Place Your Bid Proposal</h1>
          </div>
          {/* Form - section for placing bid  */}
          <section className="flex flex-col justify-center items-center">
            <form action="">
                <div className="mt-[3vmin] mb-[3vmin] py-[2vmin]">
                    {/* Project Title */}
                    <label className="text-white">Enter Bid Amount:</label>
                    <input type="number" className="border-2 border-white p-2 w-full rounded-lg text-white"
                    placeholder="Enter your bid amount for project" />
                </div>
                <div className="mt-[3vmin] mb-[3vmin]">
                    {/* Project Description */}
                    <label className="text-white ">Why you want to contribute in Project </label>
                    <textarea className="border-2 border-white p-2 w-full rounded-lg text-white"
                    placeholder="Describe Why project owner selects you " rows="10" />
                </div>
                {/* Submit Button */}
                <div className="flex justify-center items-center mt-[2vmin]">
                    <button type="submit" className="text-white bg-[#00A8E8] px-[35vmin] py-[1.5vmin] rounded-[2.5vmin]">Submit Your Bid</button>
                </div>
            </form>
          </section>
        </section>
       </main>
        </>
    )
};

export default BidingProporsalPage ; 