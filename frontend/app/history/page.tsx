"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const { user, token } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          "http://localhost:8000/api/auth/preferences",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch preferences");
        }
        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (user && token) {
      fetchPreferences();
    }
  }, [user, token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
        <h2 className="text-2xl font-bold mb-4">History</h2>
        <p className="text-gray-600">
          Please log in to view your preferences history.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-2xl mt-12 border border-gray-200 mb-10">
      <h2 className="text-3xl font-extrabold mb-8 text-center text-[#455141] tracking-tight drop-shadow">
        Your Preferences History
      </h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      {preferences && preferences.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-[#dadcc3bf] text-[#455141]">
                <th className="px-6 py-3 rounded-tl-xl text-left font-semibold">
                  #
                </th>
                <th className="px-6 py-3 text-left font-semibold">User</th>
                <th className="px-6 py-3 text-left font-semibold">Gender</th>
                <th className="px-6 py-3 text-left font-semibold">Occasion</th>
                <th className="px-6 py-3 text-left font-semibold">Footwear</th>
                <th className="px-6 py-3 rounded-tr-xl text-left font-semibold">
                  Skin Tone
                </th>
              </tr>
            </thead>
            <tbody>
              {preferences.map((pref: any, idx: number) => (
                <tr
                  key={idx}
                  className={
                    `transition-colors duration-200 text-gray-800 ` +
                    (idx % 2 === 0 ? "bg-gray-50" : "bg-white")
                  }
                >
                  <td className="px-6 py-3 font-mono text-[#747b6e] font-bold">
                    {preferences.length - idx}
                  </td>
                  <td className="px-6 py-3">{user.email || "-"}</td>
                  <td className="px-6 py-3 capitalize">{pref.gender || "-"}</td>
                  <td className="px-6 py-3 capitalize">
                    {pref.occasion || "-"}
                  </td>
                  <td className="px-6 py-3 capitalize">
                    {pref.footwear || "-"}
                  </td>
                  <td className="px-6 py-3">
                    {user.skin_tone ? (
                      <div
                        className="w-full h-8 rounded border border-gray-300 inline-block"
                        style={{ backgroundColor: user.skin_tone }}
                        title={user.skin_tone}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <p className="text-center text-gray-500">No preferences found.</p>
        )
      )}
    </div>
  );
}
