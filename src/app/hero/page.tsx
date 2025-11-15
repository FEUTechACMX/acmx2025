"use client";
import React from "react";
import WithPreloader from "../../../components/UI/WithPreLoader";
import { useRouter } from "next/navigation";
import ContinuosAnimation from "../../../components/UI/ContinousAnimation";
import Button from "../../../components/UI/Button";

export default function Page() {
  const router = useRouter();
  return (
    <WithPreloader>
      <div className="relative min-h-[100vh] w-full bg-[#FFF] text-black flex flex-col lg:flex-row items-center justify-around lg:justify-between overflow-hidden">
        {/* Animations */}
        <div className="animation1 w-[735px] h-[735px] absolute right-[-367.5px] bottom-[-367.5px] rotate-90 z-10">
          <ContinuosAnimation size={735} />
        </div>
        <div className="animation1 w-[735px] h-[735px] absolute left-[-367.5px] top-[-367.5px] rotate-270 z-10">
          <ContinuosAnimation size={735} />
        </div>

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
          z-20
        "
        >
          <h1
            className="
            text-[48px] md:text-[64px] lg:text-[96px]
            h-[48px] md:h-[64px] lg:h-[96px]
            font-['supermolot']
            leading-tight
          "
          >
            What is <span className="text-[#CD78EC]">ACMX?</span>
          </h1>

          <p
            className="
            font-['arian-light']
            text-[20px] sm:text-[28px] md:text-[32px] lg:text-[36px]
            mt-4
          "
          >
            Project ACMX is an innovative website built by students under FEU
            Tech ACM, serving as the main platform for ACM updates, information,
            and collaboration within the computer science community.
          </p>

          <Button
            size="lg"
            className="
              w-[70%] sm:w-[50%] md:w-[35%] lg:w-[30%]
              text-[18px] sm:text-[20px] md:text-[24px] lg:text-[28px]
              mt-6 mx-auto md:mx-0
              hover:shadow-lg
              hover:shadow-[#CD78EC]/30
              whitespace-nowrap
              flex items-center justify-center
            "
            onClick={() => {
              router.push("/about");
            }}
          >
            Learn More
          </Button>
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
