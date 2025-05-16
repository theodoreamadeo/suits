import "./globals.css";
import Image from "next/image";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthButton from "./components/AuthButton";
import ProtectedRoute from "./components/ProtectedRoute";
import Link from "next/link";
import LogoText from "./_assets/logo-text.png";

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
      <body>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <header className="flex justify-between items-center p-6">
              <Link
                href="/"
                className="text-2xl font-bold text-blue-800 tracking-tight"
              >
                <Image
                  src={LogoText}
                  alt="SUITS Logo"
                  width={150}
                  height={150}
                />
              </Link>
              <AuthButton />
            </header>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
