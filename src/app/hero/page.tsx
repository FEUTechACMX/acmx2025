"use client";

import React from "react";
import { useRouter } from "next/navigation";
import WithPreloader from "@/components/UI/WithPreLoader";
import { Surface, Button, Rule, Eyebrow, Display, Heading, Body } from "@/components/ds";
import { layout } from "@/styles/design-system";

export default function Page() {
  const router = useRouter();

  return (
    <WithPreloader>
      <Surface corners="both">
        <div
          className="flex flex-col min-h-[100dvh] w-full pt-[38vh] pb-[10vh] md:h-[100vh] md:min-h-0 md:justify-center md:overflow-hidden md:py-[10vh]"
          style={{ paddingLeft: layout.gutter, paddingRight: layout.gutter }}
        >
          <Eyebrow words={["CODE", "IN", "THE", "COSMOS"]} />

          <div style={{ paddingTop: "0.5rem" }}>
            <Display>
              FEU
              <br />
              INSTITUTE OF TECHNOLOGY
            </Display>
          </div>
          <Rule margin="0.5rem 0 0" />

          <Body style={{ margin: `${layout.gap} 0 0` }}>
            Project ACMX is an innovative website built by students under FEU Tech ACM, serving as
            the main platform for ACM updates, information, and collaboration.
          </Body>

          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between"
            style={{ marginTop: layout.gap, gap: "1rem" }}
          >
            <Heading>ACMX</Heading>
            <Button onClick={() => router.push("/about")} className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>
      </Surface>
    </WithPreloader>
  );
}
