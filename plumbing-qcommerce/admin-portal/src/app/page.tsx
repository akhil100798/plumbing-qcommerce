"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const EDGE_URL = process.env.NEXT_PUBLIC_EDGE_URL || "http://localhost:3000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1";
const LOCAL_MANAGER_EMAIL = process.env.NEXT_PUBLIC_MANAGER_EMAIL || "manager@plumb.local";
const LOCAL_MANAGER_PASSWORD = process.env.NEXT_PUBLIC_MANAGER_PASSWORD || "LocalPass123!";

interface JobOffer {
  jobId: string;
  customerId: string;
  distance: number;
}

export default function StoreManagerDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState("Signing in to local gateway...");
  const [liveJobs, setLiveJobs] = useState<JobOffer[]>([]);

  useEffect(() => {
    let socketInstance: ReturnType<typeof io> | null = null;
    let isMounted = true;

    async function connectGateway() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: LOCAL_MANAGER_EMAIL,
            password: LOCAL_MANAGER_PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error("Local manager login failed");
        }

        const { token } = await response.json();
        if (!isMounted) return;

        socketInstance = io(EDGE_URL, {
          auth: { token },
        });

        socketInstance.on("connect", () => {
          setIsConnected(true);
          setGatewayMessage("Authenticated edge connection");
        });

        socketInstance.on("connect_error", () => {
          setIsConnected(false);
          setGatewayMessage("Edge authentication failed");
        });

        socketInstance.on("disconnect", () => {
          setIsConnected(false);
          setGatewayMessage("Disconnected from edge");
        });

        socketInstance.on("JOB_OFFER", (data: JobOffer) => {
          setLiveJobs((prev) => [data, ...prev]);
        });
      } catch (error) {
        if (!isMounted) return;
        setIsConnected(false);
        setGatewayMessage("Local gateway login failed");
      }
    }

    connectGateway();

    return () => {
      isMounted = false;
      socketInstance?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            PlumbCommerce <span className="text-blue-200">| Store Manager</span>
          </h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-blue-100">Gateway Status:</span>
            {isConnected ? (
              <span className="flex items-center px-2 py-1 bg-green-500/20 text-green-100 text-xs font-bold rounded-full border border-green-400">
                <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
                LIVE
              </span>
            ) : (
              <span className="flex items-center px-2 py-1 bg-red-500/20 text-red-100 text-xs font-bold rounded-full border border-red-400">
                <span className="w-2 h-2 mr-1.5 bg-red-400 rounded-full"></span>
                OFFLINE
              </span>
            )}
          </div>
          <span className="hidden md:inline text-xs font-medium text-blue-100">{gatewayMessage}</span>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Jobs Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Live Active Jobs</h2>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  {liveJobs.length} Alerts
                </div>
              </div>

              {liveJobs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p>Awaiting incoming real-time requests...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveJobs.map((job, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{job.jobId}</span>
                        <span className="text-sm text-gray-500 mt-1">
                          Customer: <span className="font-semibold text-gray-700">{job.customerId}</span>
                        </span>
                        <span className="text-xs text-blue-600 mt-1 font-medium bg-blue-100 inline-block px-2 py-0.5 rounded-full w-max">
                          {job.distance.toFixed(2)} km away
                        </span>
                      </div>
                      <div className="mt-4 sm:mt-0 flex space-x-2">
                        <button className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                          View Details
                        </button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                          Dispatch Plumber
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-md font-bold text-gray-800 mb-4">Hardware Inventory</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-600 font-medium">1.5 inch PVC Pipes</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">142</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                      <span className="text-sm text-gray-600 font-medium">Teflon Tape (Rolls)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">3 (Low)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-sm text-gray-600 font-medium">Angle Valves</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">18</span>
                  </div>
                </div>
                <button className="w-full mt-5 px-4 py-2 border border-blue-600 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors bg-blue-50/20">
                  Order Restock
                </button>
             </div>

             <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-md text-white">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Total Daily Revenue</h3>
                <div className="text-3xl font-extrabold mb-4">Rs. 42,850</div>
                <div className="text-xs text-green-400 font-medium">+14.2% from yesterday</div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
