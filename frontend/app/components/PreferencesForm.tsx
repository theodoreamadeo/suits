"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const OCCASIONS = [
  { value: "CASUAL", label: "Casual" },
  { value: "ETHNIC", label: "Ethnic" },
  { value: "FORMAL", label: "Formal" },
  { value: "SPORTS", label: "Sports" },
  { value: "SMART_CASUAL", label: "Smart Casual" },
  { value: "PARTY", label: "Party" },
  { value: "TRAVEL", label: "Travel" },
];

const FOOTWEAR_OPTIONS = [
  { value: "Any", label: "Any Footwear" },
  { value: "Casual Shoes", label: "Casual Shoes" },
  { value: "Formal Shoes", label: "Formal Shoes" },
  { value: "Sports Shoes", label: "Sports Shoes" },
  { value: "Sandals", label: "Sandals" },
  { value: "Heels", label: "Heels" },
  { value: "Flats", label: "Flats" },
  { value: "Flip Flops", label: "Flip Flops" },
  { value: "Saree", label: "Saree" },
];

export default function PreferencesForm() {
  const { user, updatePreferences } = useAuth();
  const [gender, setGender] = useState(user?.preferences?.gender || "");
  const [occasion, setOccasion] = useState(user?.preferences?.occasion || "");
  const [footwear, setFootwear] = useState(user?.preferences?.footwear || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      await updatePreferences(gender, occasion, footwear);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update preferences"
      );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Your Preferences</h2>

      {error && (
        <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-2 text-sm text-green-600 bg-green-100 rounded">
          Preferences updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-md border-gray-300 border-2 p-1 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occasion
          </label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full rounded-md border-gray-300 border-2 p-1 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select occasion</option>
            {OCCASIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footwear
          </label>
          <select
            value={footwear}
            onChange={(e) => setFootwear(e.target.value)}
            className="w-full rounded-md border-gray-300 border-2 p-1 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select footwear</option>
            {FOOTWEAR_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}
