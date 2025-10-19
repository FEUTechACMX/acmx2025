import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-purple-400 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-60 left-1/4 w-3 h-3 bg-white rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-white rounded-full"></div>
        <div className="absolute bottom-60 left-1/2 w-1 h-1 bg-white rounded-full"></div>
        
        {/* Geometric lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,20 Q25,10 50,20 T100,20" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3"/>
          <path d="M0,60 Q25,70 50,60 T100,60" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3"/>
          <path d="M20,0 Q10,25 20,50 T20,100" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3"/>
          <path d="M80,0 Q90,25 80,50 T80,100" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3"/>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-8">
            {/* FEU Tech Logo */}
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center relative">
              <div className="text-xs text-white font-bold text-center leading-tight">
                <div>FEU</div>
                <div>INSTITUTE</div>
                <div>OF</div>
                <div>TECHNOLOGY</div>
              </div>
              <div className="absolute bottom-0 text-[8px] text-white">1992</div>
              <div className="absolute w-4 h-4 bg-yellow-400 rounded-full"></div>
            </div>

            {/* ACM Logo */}
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex flex-col items-center justify-center">
              <div className="text-white font-bold text-lg">acm</div>
              <div className="text-white text-xs">Chapter</div>
            </div>

            {/* Organization Name */}
            <div className="text-white">
              <div className="text-lg font-normal">FEU Institute of Technology</div>
              <div className="text-2xl font-bold">Association for Computing Machinery</div>
              <div className="text-lg font-normal">Student Chapter</div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border-2 border-purple-600 p-12 shadow-2xl">
            <h1 className="text-4xl font-bold text-purple-800 text-center mb-8 uppercase tracking-wide">
              About ACM
            </h1>
            
            {/* Decorative separator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px bg-purple-600"></div>
              <div className="mx-4">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1 h-px bg-purple-600"></div>
            </div>

            {/* Main content */}
            <div className="text-lg text-purple-800 leading-relaxed text-center">
              <p className="mb-6">
                <span className="font-bold">FEU Tech ACM Student Chapter</span> is an organization operating exclusively for{' '}
                <span className="font-bold">educational and scientific purposes</span> in order to promote to increased knowledge 
                and greater interest in science, design, development, construction, languages, management and applications; 
                and as a means of communication between persons having an interest in computing.
              </p>
            </div>

            {/* Closing remark */}
            <div className="text-center mt-8">
              <p className="text-purple-600 italic text-lg">
                Join us in shaping the future of computing!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-purple-800 rounded-full px-8 py-4 flex items-center justify-between">
            {/* Contact Information */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-sm">acm.feu.it@gmail.com</span>
              </div>

              <div className="flex items-center space-x-2 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">feutechACM</span>
              </div>

              <div className="flex items-center space-x-2 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                <span className="text-sm">feutechACM</span>
              </div>

              <div className="flex items-center space-x-2 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">feutech.acm.org</span>
              </div>
            </div>

            {/* Decorative lines */}
            <div className="flex space-x-1">
              <div className="w-1 h-6 bg-white opacity-50"></div>
              <div className="w-1 h-6 bg-white opacity-30"></div>
              <div className="w-1 h-6 bg-white opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
