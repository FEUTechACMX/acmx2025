"use client";

import React from "react";
import Section from "./Section";
import { Body, useDS } from "@/components/ds";

export default function StudentChapter() {
  const { c } = useDS();
  const emphasis = { color: c.text, fontWeight: 500 };

  return (
    <Section index="01" label="The Chapter" heading="ACM STUDENT CHAPTER">
      <Body>
        Driven by innovation and united by passion, the FEU Tech ACM Student Chapter is a recognized
        student organization that stands as the{" "}
        <span style={emphasis}>mother organization of the Computer Science department</span> of the
        institution, and the Philippines&rsquo; second internationally accredited ACM student
        chapter — empowering students to explore their passion for technology, spark innovation, and
        shape the future, one line of code at a time.
      </Body>
      <Body>
        Our core values are <span style={emphasis}>Aptitude, Competence, and Magnanimity</span>.
      </Body>
    </Section>
  );
}
