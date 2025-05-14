import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthButton from "./components/AuthButton";
import ProtectedRoute from "./components/ProtectedRoute";

const inter = Inter({ subsets: ["latin"] });

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const metadata = {
  title: "SUITS Singapore",
  description: "Your personal suit recommendation system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <header className="flex justify-between items-center p-4 border-gray-200">
              <h1 className="text-2xl font-bold text-blue-800 tracking-tight">
                SUITS
              </h1>
              <AuthButton />
            </header>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
