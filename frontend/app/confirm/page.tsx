import { LampDesk } from "lucide-react";
import MainLogo from "../_assets/logo-text.png";
import Image from "next/image";

export default function ConfirmPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center bg-white/80 rounded-3xl shadow-xl px-10 py-12">
        <LampDesk size={75} className="mb-4 text-[#47534d] animate-bounce" />
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#747b6e] mb-4 text-center flex flex-wrap items-center justify-center gap-2">
          We hope your personalised picks{" "}
          <span className="inline-block align-middle">
            <Image
              src={MainLogo}
              alt="SUITS Logo"
              height={50}
              style={{ display: "inline", verticalAlign: "middle" }}
            />
          </span>{" "}
          you well.
        </h1>
        <p className="text-lg md:text-2xl text-gray-600 mb-8 text-center max-w-xl">
          Let the{" "}
          <span className="font-bold text-[#203429]">navigation lamp</span>{" "}
          guide you to your style.
        </p>
        <a
          href="/"
          className="inline-block px-8 py-3 bg-[#E1DBCB] text-white font-bold rounded-full shadow hover:bg-[#9c988b] transition-colors text-lg"
        >
          Back to Recommendations
        </a>
      </div>
    </div>
  );
}
