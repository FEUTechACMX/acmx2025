"use client";
import Image from "next/image";
import React from "react";
import WithPreloader from "../../../components/UI/WithPreLoader";
import { useRouter } from "next/navigation";
import ContinuosAnimation from "../../../components/UI/ContinousAnimation";
import Button from "../../../components/UI/Button";

export default function Page() {
  const router = useRouter();
  return (
    <WithPreloader>
      <div className="relative min-h-[100dvh] w-full bg-[#FFF] flex flex-col items-center justify-center gap-5 overflow-hidden">
        {/* Animations */}
        <div className="animation1 w-[344px] h-[344px] absolute right-[-172px] bottom-[-172px] rotate-90 z-10 pointer-events-none">
          <ContinuosAnimation size={344} />
        </div>
        <div className="animation1 w-[344px] h-[344px] absolute left-[-172px] top-[-172px] rotate-270 z-10 pointer-events-none">
          <ContinuosAnimation size={344} />
        </div>

        {/* Upper Content */}
        <div
          className=" w-[86vw] 
        flex flex-col"
        >
          <div
            className="
          flex items-center justify-start 
          h-[24px] sm:h-[48px] md:h-[77px] lg:h-[119px]"
          >
            <img src="/assets/logo.png" className="h-full" alt="logo" />
            <h1
              className="
            text-[1.25rem] sm:text-[2.5rem] md:text-[4rem] lg:text-[5.625rem]
            text-center 
            font-[Arian-bold]"
            >
              FEU
            </h1>
          </div>
          <h1
            className="
          text-[1.3125rem] sm:text-[3rem] md:text-[3.125rem] lg:text-[8rem]
          font-[Supermolot] 
          text-[#CF78EC]
          whitespace-nowrap"
          >
            INSTITUTE OF TECHNOLOGY
          </h1>
        </div>

        {/*Bottom Content */}
        <div
          className="
        flex justify-between items-end 
        w-[86vw]
        "
        >
          {/* Left side content */}
          <div
            className="
          side
          w-[40vw]          
          flex flex-col 
          justify-end
          items-start
          h-full
          text-center lg:text-left
        "
          >
            <h1
              className="
            font-['Arian-Bold']
            text-[0.9375rem] sm:text-[1.125rem] md:text-[2.5rem] lg:text-[4rem]
            leading-tight
            align-bottom
            text-left
            "
            >
              ACM X
            </h1>

            <p
              className="
            font-['arian-light']
            text-[0.625rem] sm:text-[0.8125rem] md:text-[1.25rem] lg:text-[1.75rem]
            align-bottom
            text-left
          "
            >
              Project ACMX is an innovative website built by students under FEU
              Tech ACM, serving as the main platform for ACM updates,
              information, and collaboration.
            </p>
          </div>

          {/* Right side image */}
          <div className="flex flex-col items-end justify-end h-full w-[40vw]">
            <h1
              className="font-['Arian-Bold'] 
              text-[0.75rem] sm:text-[1.125rem] md:text-[2.5rem] lg:text-[4rem]
              text-right
              "
            >
              Code in the Cosmos
            </h1>
            <Button
              size="sm"
              className="
              w-[70%] sm:w-[50%] md:w-[35%] lg:w-[30%]
              hover:shadow-lg
              hover:shadow-[#CD78EC]/30
              cursor-pointer
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
        </div>
      </div>
    </WithPreloader>
  );
}
