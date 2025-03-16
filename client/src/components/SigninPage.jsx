/* eslint-disable no-unused-vars */
import { Link, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";
import axios from "axios";

const CreateAccount = () => {
  const [formData, setformData] = useState({
    username: "",
    email: "",
    password: "",
    usertype: "", // Now a single string, not an array
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setformData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const Acoount_Creation_API = "http://localhost:8000/api/user";
    console.log("This is account creation API:", Acoount_Creation_API);
    console.log("Form Data before sending:", formData);

    try {
      const response = await axios.post(Acoount_Creation_API,{
        username: formData.username,
        email: formData.email,
        password: formData.password,
        usertype: formData.usertype, // Assuming usertype is a single string.
      }, {
        withCredentials: true,
      });
      console.log("Registration successful:", response.data);
      setSuccess(true);
      navigate("/loginaccount");
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Create account page */}
      <div className="flex items-center justify-center min-h-screen w-full">
        <main className="h-auto w-[80vmin] bg-[#121212] border border-[#EAEAEA] flex items-center justify-center flex-col">
          <section className="flex justify-center mt-[3vmin]">
            <h1 className="text-white text-[2.5vmin] font-semibold">
              Create an Account
            </h1>
          </section>
          <form onSubmit={handleSubmit}>
            <section>
              <div className="flex flex-col gap-[1.4vmin]">
                <label className="text-white">Username :</label>
                <input
                  type="text"
                  placeholder="Enter your Username"
                  className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin] px-[1vmin]"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-[1.4vmin]">
                <label className="text-white">Email :</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin] px-[1vmin]"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex flex-col mt-[1.4vmin] gap-[1.4vmin]">
                <label className="text-white">Password :</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin] px-[1vmin]"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Radio Buttons for User Type (Only One Selection Allowed) */}
              <div className="flex flex-row gap-[2.5vmin] mt-[2vmin]">
                {[
                  "Junior Developer",
                  "Senior Developer",
                  "Fresher Developer",
                ].map((usertype) => (
                  <div key={usertype} className="flex items-center gap-[1vmin]">
                    <input
                      type="radio" // Changed from checkbox to radio
                      name="usertype" // Same name ensures only one can be selected
                      value={usertype}
                      checked={formData.usertype === usertype} // Single selection
                      onChange={handleChange}
                      className="w-[2.5vmin] h-[2.5vmin] rounded-full border border-gray-300 bg-white appearance-none checked:bg-[#00A8E8]"
                    />
                    <label className="text-white">{usertype}</label>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex justify-center gap-[2vmin] mt-[4vmin]">
              <button
                className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[60vmin]"
                onClick={handleSubmit}
              >
                Create Account
              </button>
            </section>
          </form>

          <section className="mt-[1.5vmin] flex justify-center">
            <h1 className="text-white underline">
              Already Have an Account?
              <Link to="/loginaccount">
                <span>Login</span>
              </Link>
            </h1>
          </section>
          <div className="h-[0.3vmin] w-[73vmin] bg-white mt-[1.5vmin]"></div>
          <section className="mt-[4vmin] flex items-center justify-center mb-[3vmin]">
            <button className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[60vmin] flex flex-row justify-center items-center gap-[2vmin]">
              <FaGithub className="text-[3vmin]" /> GitHub Account
            </button>
          </section>
        </main>
      </div>
    </>
  );
};

export default CreateAccount;
