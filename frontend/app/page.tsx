"use client";

import AuthButton from "./components/AuthButton";
import PreferencesForm from "./components/PreferencesForm";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.skin_tone) {
      router.replace("/suit-me");
    }
  }, [user, router]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {user && !user.preferences && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to SUITS!</h2>
            <p className="text-gray-600 mb-6">
              To get started, please tell us a bit about yourself and your
              preferences.
            </p>
            <PreferencesForm />
          </div>
        )}

        {user && user.preferences && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome back!</h2>
            <p className="text-gray-600 mb-6">
              You can update your preferences below or proceed to get your suit
              recommendations.
            </p>
            <PreferencesForm />
            <div className="mt-8 flex gap-4">
              <a
                href="/suit-me"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Suit Recommendations
              </a>
              <a
                href="/body-measurement"
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Update Body Measurements
              </a>
            </div>
          </div>
        )}

        {!user && (
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to SUITS</h2>
            <p className="text-gray-600 mb-6">
              Please login or register to get personalized suit recommendations.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
