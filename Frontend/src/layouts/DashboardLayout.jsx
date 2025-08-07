import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Navbar from "../components/Navbar";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen">
        <Navbar/>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
