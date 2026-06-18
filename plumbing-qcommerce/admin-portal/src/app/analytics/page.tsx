"use client";

import { useState, useEffect } from "react";

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activePlumbers: 0,
    totalOrders: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          console.warn("No admin token found in localStorage. Dashboard showing stale/mock data.");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:8081/api/v1/admin/metrics", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch live metrics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            PlumbCommerce <span className="text-blue-400">| Global Admin</span>
          </h1>
          <nav className="flex space-x-4">
            <button className="text-blue-200 hover:text-white px-3 py-2 text-sm font-medium">Dashboard</button>
            <button className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium">Analytics</button>
            <button className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Plumbers</button>
            <button className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Stores</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="pb-5 border-b border-gray-200 mb-8 sm:flex sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold leading-6 text-gray-900">Platform Analytics</h2>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button type="button" className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Export Report
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border-l-4 border-blue-500">
            <dt className="truncate text-sm font-medium text-gray-500">Total Revenue (LIVE)</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {loading ? "Loading..." : `Rs. ${metrics.totalRevenue.toLocaleString()}`}
            </dd>
            <p className="mt-2 flex items-baseline text-sm font-semibold text-green-600">
              <svg className="h-4 w-4 shrink-0 self-center text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>
              Real-time
            </p>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border-l-4 border-emerald-500">
            <dt className="truncate text-sm font-medium text-gray-500">Active Plumbers</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{metrics.activePlumbers}</dd>
            <p className="mt-2 text-sm text-gray-500">Verified & Online</p>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border-l-4 border-purple-500">
            <dt className="truncate text-sm font-medium text-gray-500">Total Job Volume</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{metrics.totalOrders}</dd>
            <p className="mt-2 text-sm text-green-600 font-medium">Cummulative Volume</p>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border-l-4 border-orange-500">
            <dt className="truncate text-sm font-medium text-gray-500">Pending Actions</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{metrics.pendingOrders}</dd>
            <p className="mt-2 text-sm text-orange-500 font-medium text-xs">Awaiting Assignments</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Job Volume by City</h3>
            <div className="h-64 flex items-end space-x-2 bg-gray-50 rounded p-4">
              {/* Mock Bar Chart */}
              <div className="w-1/4 bg-blue-500 rounded-t" style={{height: '100%'}}></div>
              <div className="w-1/4 bg-blue-400 rounded-t" style={{height: '80%'}}></div>
              <div className="w-1/4 bg-blue-300 rounded-t" style={{height: '65%'}}></div>
              <div className="w-1/4 bg-blue-200 rounded-t" style={{height: '40%'}}></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
              <span>Mumbai</span>
              <span>Bangalore</span>
              <span>Delhi</span>
              <span>Pune</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Store Inventory Alerts</h3>
            <ul role="list" className="divide-y divide-gray-100">
              <li className="flex justify-between gap-x-6 py-3">
                <div className="flex gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">Store #142 (Andheri East)</p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">Teflon Tape (Rolls) stock critical</p>
                  </div>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm leading-6 text-gray-900">3 remaining</p>
                  <p className="mt-1 text-xs leading-5 text-red-500 font-medium">Restock Priority</p>
                </div>
              </li>
              <li className="flex justify-between gap-x-6 py-3">
                <div className="flex gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">Store #088 (Indiranagar)</p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">1 inch CPVC Pipes out of stock</p>
                  </div>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm leading-6 text-gray-900">0 remaining</p>
                  <p className="mt-1 text-xs leading-5 text-red-500 font-medium">Restocked Delayed</p>
                </div>
              </li>
              <li className="flex justify-between gap-x-6 py-3">
                <div className="flex gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">Store #211 (Koramangala)</p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">White Cement 1kg low</p>
                  </div>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm leading-6 text-gray-900">12 remaining</p>
                  <p className="mt-1 text-xs leading-5 text-yellow-600 font-medium">Watch</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
