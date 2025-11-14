import React from "react";
import WithPreloader from "../../../components/UI/WithPreLoader";

export default function Page() {
  return (
    <WithPreloader>
      <div className="min-h-[100vh] bg-[#FFF] text-black flex flex-col lg:flex-row items-center justify-around lg:justify-between">
        {/* Left side content */}
        <div
          className="
          mt-[75px] md:mt-[25px] lg:mt-0
          side 
          w-[90%] lg:w-[50%] 
          lg:ml-[75px] 
          flex flex-col justify-around 
          items-center lg:items-start
          lg:h-[50vh]
          text-center lg:text-left

        "
        >
          <h1
            className="
            text-[48px] md:text-[64px] lg:text-[96px]
            h-[48px] md:h-[64px] lg:h-[96px]
            font-['fjalla-one'] 
            leading-tight
          "
          >
            What is <span className="text-[#CD78EC]">ACMX?</span>
          </h1>

          <p
            className="
            font-['arapey'] 
            text-[20px] sm:text-[28px] md:text-[32px] lg:text-[36px]
            mt-4
          "
          >
            Project ACMX is an innovative cross-platform app built by students
            under FEU Tech ACM, serving as the main platform for ACM updates,
            information, and collaboration within the computer science
            community.
          </p>

          <button
            className="
            font-['arapey']
            text-white
            w-[60%] sm:w-[40%] md:w-[25%] 
            text-[20px] sm:text-[28px] md:text-[32px] lg:text-[36px] 
            pt-[5px] pb-[5px] px-[10px] 
            rounded cursor-pointer 
            bg-[#CD78EC] 
  
            mt-6 mx-auto md:mx-0
          "
          >
            Learn More
          </button>
        </div>

        {/* Right side image */}
        <div
          className="
          side 
          
          w-full md:w-[50%] 
          flex justify-center lg:justify-end
          items-center
          mt-[40px] md:mt-0 
          mr-0 lg:mr-[75px]
        "
        >
          <div
            className="
            mb-[75px] md:mb-[25px] lg:md-0
            imageHolder 
            w-[301px] lg:w-[674px] 
            h-[376px] lg:h-[728px] 
            rounded-[10px] 
            bg-black
          "
          ></div>
        </div>
      </div>
    </WithPreloader>
  );
}
