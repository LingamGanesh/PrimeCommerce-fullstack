import React, { useState } from "react";
import { Usermenu } from "../components/Usermenu";
import { Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";

const Dashboard = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* 🔝 TOP NAVBAR */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">

        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-gray-600"
          >
            <FaBars size={20} />
          </button>

          <h1 className="text-xl font-semibold text-gray-800">
            Dashboard
          </h1>
        </div>

        {/* Right */}
        <div className="text-sm text-gray-600">
          Welcome, <span className="font-medium">Ganesh 👋</span>
        </div>
      </header>

      {/* 📦 MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">

        {/* 🧭 SIDEBAR */}
        <aside
          className={`
            fixed lg:static top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r z-30
            transform ${open ? "translate-x-0" : "-translate-x-full"} 
            lg:translate-x-0 transition-transform duration-300
          `}
        >
          <div className="h-full overflow-y-auto p-4">
            <Usermenu />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/30 lg:hidden"
          />
        )}

        {/* 📄 CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {/* Page Container */}
          <div className="max-w-7xl mx-auto">

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 min-h-[70vh]">

              <Outlet />

            </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Dashboard;