import React from "react";

export default function MerchandisePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-5xl sm:text-7xl md:text-[96px] font-['Fjalla-One'] text-[#CF78EC] leading-none">
          MERCHANDISE
        </h1>
        <div className="w-16 h-[2px] bg-[#CF78EC] mx-auto mt-6 mb-4" />
        <p className="text-lg sm:text-xl font-['Arian-light'] text-gray-400 tracking-wide uppercase">
          Coming Soon
        </p>
        <p className="text-sm font-['Arian-light'] text-gray-300 mt-2 max-w-md mx-auto">
          We&apos;re working on this page. Check back later!
        </p>
      </div>
    </div>
  );
}
