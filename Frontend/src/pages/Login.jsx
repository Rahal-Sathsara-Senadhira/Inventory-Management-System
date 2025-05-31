import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Normally you'd validate user
    navigate("/inventory/main/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 shadow-lg border rounded">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleLogin}
      >
        Log In
      </button>
    </div>
  );
};

export default Login;
