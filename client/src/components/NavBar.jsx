import {Link}  from "react-router-dom" ; 

const Navbar = ()=>{
    return (
     <>
      <div>
      <nav className="w-full bg-[#1E1E1E] h-[8vmin] flex justify-between items-center">
        <div>
          <Link to="/">
          <h1 className="text-white text-[4vmin] font-bold ml-[3vmin]">DevHubs</h1>
          </Link>
        </div>
        <div>
        <ul className="flex items-center gap-[8vmin] text-white mr-[3vmin] ">
         <Link to="/dashboard">Explore Project</Link>
         <Link to="/listproject">List Project</Link>
         <Link to="/about">About</Link>
         <Link to="/createaccount" className="flex items-center">
         <button className="h-[5vmin] w-[22vmin] bg-[#00A8E8] rounded-[2vmin] text-[2.3vmin]">
          Create Account 
         </button>
         </Link>
        </ul>
        </div>
      </nav>
     </div>
     </>
    )
};

export default Navbar;  //exporting the component for use in other parts of the application.