"use client";

import React from "react";
import { Surface, Column, PageHeader, Body } from "@/components/ds";
import StudentChapter from "@/components/about/StudentChapter";
import Mission from "@/components/about/Mission";
import Vision from "@/components/about/Vision";
import ContactFooter from "@/components/about/ContactFooter";

export default function AboutPage() {
  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["WHERE", "CODES", "MEET", "THE", "COSMOS"]}
          title={
            <>
              ABOUT
              <br />
              THE CHAPTER
            </>
          }
          intro={
            <Body>
              The FEU Tech ACM Student Chapter is the mother organization of the Computer Science
              department and the Philippines&rsquo; second internationally accredited ACM student
              chapter.
            </Body>
          }
        />

        <StudentChapter />
        <Mission />
        <Vision />
        <ContactFooter />
      </Column>
    </Surface>
  );
}
