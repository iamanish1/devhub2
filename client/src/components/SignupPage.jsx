/* eslint-disable no-unused-vars */
import { Link, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { useState  , } from "react";
import axios from "axios";
const SingupPage = ()=>{
  const [formdata , setformdata] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // To redirect users after login
  const handelChange = (e)=>{
    setformdata({...formdata, [e.target.name] : e.target.value });
  };
  const handleSubmit = async (e)=>{
    e.preventDefault();
    try {
      const Login_Api = "http://localhost:8000/api/login"
      const response = await axios.post(Login_Api, {
        email: formdata.email,
        password: formdata.password,
      }, {
        withCredentials: true,
      });
      console.log("Login successful:", response.data);
        localStorage.setItem("token", response.data.token); // Store token in localStorage
  
        navigate("/dashboard"); // Redirect to dashboard after successful login
        setLoading(false);
      
    } catch (error) {
      setLoading(true);
      setError(error.response.data.message);
      setTimeout(() => {
        setError(null);
        setLoading(false);
      }, 5000);
      
    }
   
  };
    return (
        <>
            {/* Create account page For account creation  */}
      <div className="flex items-center justify-center min-h-screen w-full">
        <main
          className="h-[85vmin] w-[80vmin] bg-[#121212] 
        border border-[#EAEAEA] flex flex-col"
        >
          <section className="flex justify-center mt-[3vmin]">
            <h1 className="text-white text-[2.8vmin] font-semibold">Login Account</h1>
          </section>
          <form onSubmit={handleSubmit}>
          <section className="mt-[7vmin]">
            <div className="flex flex-col gap-[1.4vmin] ml-[2vmin] mr-[2vmin]">
              <label className="text-white">Email :</label>
              <input
                type="text"
                placeholder=" Enter your email"
                className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin]"
                name="email"
                value={formdata.email}
                onChange={handelChange}
              />
            </div>
            <div className="flex flex-col mt-[1.4vmin] gap-[1.4vmin] ml-[2vmin] mr-[2vmin]">
              <label className="text-white">Password :</label>
              <input
                type="password"
                placeholder=" Enter your password"
                className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin]"
                name="password"
                value={formdata.password}
                onChange={handelChange}
              />
            </div>
          </section>
          <section className="flex justify-center gap-[2vmin] mt-[6vmin]">
            <button className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[60vmin]">
              Login Account
            </button>
          </section>
          </form>
          <section className="mt-[1.5vmin] flex justify-center">
            <h1 className="text-white underline">
              Dont Have a Account?
              <Link to="/createaccount">
                <span>Account</span>
              </Link>
            </h1>
          </section>
          <div className="h-[0.3vmin] w-[73vmin] bg-white mt-[3vmin] ml-[2.5vmin]"></div>
          <section className="mt-[4vmin] flex items-center justify-center">
            <button
              className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[60vmin] flex flex-row justify-center
            items-center gap-[2vmin]"
            >
              <FaGithub className="text-[3vmin]" /> Git Hub Account
            </button>
          </section>
        </main>
      </div>
        </>
    )
};

export default SingupPage;  // export this component to use it in other files.