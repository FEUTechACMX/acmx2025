import React from "react";

const ContactFooter = () => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-lg rounded-full px-6 py-3 shadow-2xl z-50 border-2 border-[#DEB7F3] w-auto max-w-[90%] sm:max-w-[500px]">
      <div className="flex items-center justify-center space-x-4 sm:space-x-6">
        <a
          href="mailto:contact@acmchapter.org"
          className="text-[#8B7FBB] hover:text-[#DEB7F3] transition-colors duration-300 font-['arian-bold'] text-sm sm:text-base whitespace-nowrap"
        >
          <span>Email</span>
        </a>
        <span className="text-[#DEB7F3] font-bold hidden md:inline">|</span>
        <a
          href="https://facebook.com/acmchapter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8B7FBB] hover:text-[#DEB7F3] transition-colors duration-300 font-['arian-bold'] text-sm sm:text-base whitespace-nowrap"
        >
          <span>Facebook</span>
        </a>
        <span className="text-[#DEB7F3] font-bold hidden md:inline">|</span>
        <a
          href="https://instagram.com/acmchapter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8B7FBB] hover:text-[#DEB7F3] transition-colors duration-300 font-['arian-bold'] text-sm sm:text-base whitespace-nowrap"
        >
          <span>Instagram</span>
        </a>
      </div>
    </div>
  );
};

export default ContactFooter;