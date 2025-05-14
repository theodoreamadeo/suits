"use client";
import PreferencesForm from "../components/PreferencesForm";

export default function PreferenceFormPage() {
  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Set Your Preferences
      </h2>
      <PreferencesForm />
    </div>
  );
}
