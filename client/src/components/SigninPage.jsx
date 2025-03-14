import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
const CreateAccount = () => {
  return (
    <>
      {/* Create account page For account creation  */}
      <div className="flex items-center justify-center min-h-screen w-full">
        <main
          className="h-auto w-[80vmin] bg-[#121212]
        border border-[#EAEAEA] flex items-center justify-center flex-col"
        >
          <section className="flex justify-center mt-[3vmin]">
            <h1 className="text-white text-[2.5vmin] font-semibold">Create an Account</h1>
          </section>
          <section>
            <div className="flex flex-col gap-[1.4vmin]">
              <label className="text-white">Username :</label>
              <input
                type="text"
                placeholder=" Enter your Username"
                className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin]"
              />
            </div>
            <div className="flex flex-col gap-[1.4vmin]">
              <label className="text-white">Email :</label>
              <input
                type="text"
                placeholder=" Enter your email"
                className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin]"
              />
            </div>
            <div className="flex flex-col mt-[1.4vmin] gap-[1.4vmin]">
              <label className="text-white">Password :</label>
              <input
                type="password"
                placeholder=" Enter your password"
                className="text-white border border-[#EAEAEA] h-[6vmin] mb-[0.9vmin]"
              />
            </div>

            <div className="flex flex-row gap-[2.5vmin] mt-[2vmin]">
              <div className="flex items-center gap-[1vmin]">
                <input
                  type="checkbox"
                  className="w-[2.5vmin] h-[2.5vmin] rounded-full border border-gray-300 bg-white appearance-none
                checked:bg-[#00A8E8]"
                />
                <label className="text-white">Junior Developer</label>
              </div>
              <div className="flex items-center gap-[1vmin]">
                <input
                  type="checkbox"
                  className="w-[2.5vmin] h-[2.5vmin] rounded-full border border-gray-300 bg-white appearance-none
                checked:bg-[#00A8E8]"
                />
                <label className="text-white">Senior Developer</label>
              </div>
              <div className="flex items-center gap-[1vmin]">
                <input
                  type="checkbox"
                  className="w-[2.5vmin] h-[2.5vmin] rounded-full border border-gray-300 bg-white appearance-none
                checked:bg-[#00A8E8]"
                />
                <label className="text-white">Fresher Developer</label>
              </div>
            </div>
          </section>
          <section className="flex justify-center gap-[2vmin] mt-[4vmin]">
            <button className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[60vmin]">
              Create Account
            </button>
          </section>
          <section className="mt-[1.5vmin] flex justify-center">
            <h1 className="text-white underline">
              Already Have a Account?
              <Link to="/loginaccount">
                <span>Login</span>
              </Link>
            </h1>
          </section>
          <div className="h-[0.3vmin] w-[73vmin] bg-white mt-[1.5vmin]"></div>
          <section className="mt-[4vmin] flex items-center justify-center mb-[3vmin]">
            <button
              className="bg-[#00A8E8] text-white rounded-full h-[6vmin] w-[60vmin] flex flex-row justify-center
            items-center gap-[2vmin] "
            >
              <FaGithub className="text-[3vmin]" /> Git Hub Account
            </button>
          </section>
        </main>
      </div>
    </>
  );
};

export default CreateAccount;
