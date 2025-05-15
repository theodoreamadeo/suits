"use client";

import AuthButton from "./components/AuthButton";
import PreferencesForm from "./components/PreferencesForm";
import { useAuth } from "./context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MainLogo from "./_assets/main-logo.png";
import Image from "next/image";
import SkinTonePicture from "./_assets/skin-tone.jpg";
import BodyMeasurementPicture from "./_assets/body-measurement.jpg";
import HistoryPreferencesPicture from "./_assets/saved-preferences.jpg";
import RecommendationSystemPicture from "./_assets/recommendation-system.jpg";
import { motion } from "framer-motion";


export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const mainLogoRef = useRef<HTMLDivElement>(null);
  const featureSectionRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  const features = [
    {
      title: "Skin Tone Detection",
      image: SkinTonePicture,
    },
    {
      title: "Body Measurement",
      image: BodyMeasurementPicture,
    },
    {
      title: "History Preferences",
      image: HistoryPreferencesPicture,
    },
    {
      title: "Recommendation System",
      image: RecommendationSystemPicture,
    },
  ];


  useEffect(() => {
    if (user && !user.skin_tone) {
      router.replace("/suit-me");
    }
  }, [user, router]);


  useEffect(() => {
  let scrollTimeout: NodeJS.Timeout | null = null;

  const handleMouseMove = (e: MouseEvent) => {
    const threshold = 100;
    const { clientY } = e;
    const distanceFromBottom = window.innerHeight - clientY;

    const logoBounds = mainLogoRef.current?.getBoundingClientRect();
    const featureBounds = featureSectionRef.current?.getBoundingClientRect();

    // Scroll down: when mouse is inside logo section and near bottom
    if (
      logoBounds &&
      clientY >= logoBounds.top &&
      clientY <= logoBounds.bottom &&
      distanceFromBottom < threshold
    ) {
      if (!scrollTimeout && featureSectionRef.current) {
        featureSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        scrollTimeout = setTimeout(() => (scrollTimeout = null), 1000);
      }
    }

    // Scroll up: when mouse is inside feature section and near top
    if (
      featureBounds &&
      clientY >= featureBounds.top &&
      clientY <= featureBounds.bottom &&
      clientY - featureBounds.top < threshold
    ) {
      if (!scrollTimeout && mainLogoRef.current) {
        mainLogoRef.current.scrollIntoView({ behavior: 'smooth' });
        scrollTimeout = setTimeout(() => (scrollTimeout = null), 1000);
      }
    }
  };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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
          <div>
            {/* Main Logo Section with auto-scroll trigger */}
            <div
              ref={mainLogoRef}
              className="h-screen flex flex-col items-center justify-center"
            >
              <Image src={MainLogo} alt="Main Logo" width={650} />
            </div>

            {/* Features Section with motion and scroll target */}
            <motion.div
              ref={featureSectionRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="w-full">
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h2 className="text-3xl font-serif font-semibold text-center text-green-900 mb-8">
                    SUITS Main Features
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="relative w-full h-72 rounded overflow-hidden shadow-md group"
                      >
                        <Image
                          src={feature.image}
                          alt={feature.title}
                          fill
                          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-white font-bold text-lg">{feature.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <section className="w-full py-16 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                  <h2 className="text-3xl font-serif font-semibold text-green-900 mb-4">
                    The Future of Fashion is Regenerative
                  </h2>
                  <p className="italic font-semibold text-gray-700 mb-6">
                    AI-powered wardrobe assistant that delivers personalized outfit recommendations in the world.
                  </p>
                  <p className="text-gray-800 mb-4">
                    SUITS Pte. Ltd. is transforming fashion retail with AI Wardrobe—an intelligent styling assistant that uses AI to deliver personalized outfit recommendations based on body shape, skin tone, and occasion.
                  </p>
                  <p className="text-gray-800">
                    With a growing demand for AI-driven fashion solutions, SUITS targets busy professionals and style-conscious shoppers through retail partnerships and premium subscriptions.
                  </p>
                </div>
              </section>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
