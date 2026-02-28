"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { driverApi } from "@/lib/api";

interface DriverInfo {
  id: number;
  name: string;
  email: string;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // edit form state must be declared unconditionally
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await driverApi.getRegistered();
        setDrivers(res.data.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cyber-pink-500">{error}</p>
      </div>
    );
  }

  const startEdit = (driver: DriverInfo) => {
    setEditingId(driver.id);
    setEditLat(driver.current_lat || 0);
    setEditLng(driver.current_lng || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLat(null);
    setEditLng(null);
  };

  const saveLocation = async () => {
    if (editingId == null || editLat == null || editLng == null) return;
    try {
      await driverApi.setLocation(editingId, editLat, editLng);
      toast.success("Location updated");
      // refresh list
      const res = await driverApi.getRegistered();
      setDrivers(res.data.data || []);
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-cyber-dark-900">
      <h1 className="text-2xl font-bold text-cyber-purple-600 mb-4">Registered Drivers &amp; Locations</h1>
      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-cyber-green-500">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Status</th>
              <th className="p-2">Latitude</th>
              <th className="p-2">Longitude</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-cyber-purple-500/30">
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.email}</td>
                <td className="p-2 capitalize">{d.status}</td>
                <td className="p-2">
                  {editingId === d.id ? (
                    <input
                      type="number"
                      value={editLat ?? 0}
                      onChange={(e) => setEditLat(parseFloat(e.target.value))}
                      className="w-24 bg-cyber-dark-700 text-cyber-green-300 p-1 rounded"
                    />
                  ) : (
                    d.current_lat ?? "—"
                  )}
                </td>
                <td className="p-2">
                  {editingId === d.id ? (
                    <input
                      type="number"
                      value={editLng ?? 0}
                      onChange={(e) => setEditLng(parseFloat(e.target.value))}
                      className="w-24 bg-cyber-dark-700 text-cyber-green-300 p-1 rounded"
                    />
                  ) : (
                    d.current_lng ?? "—"
                  )}
                </td>
                <td className="p-2">
                  {editingId === d.id ? (
                    <div className="flex gap-1">
                      <button onClick={saveLocation} className="btn-primary py-1 px-2">
                        Save
                      </button>
                      <button onClick={cancelEdit} className="btn-secondary py-1 px-2">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(d)} className="btn-secondary py-1 px-2">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}