"use client";

import Link from "next/link";
import { Surface, Column, PageHeader, Body, Button } from "@/components/ds";
import { layout } from "@/styles/design-system";

export default function ApplySuccessPage() {
  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["APPLICATION", "RECEIVED"]}
          title={
            <>
              WE&apos;VE
              <br />
              GOT IT
            </>
          }
          intro={
            <Body>
              An officer will review your proof of payment. Once it is accepted you can log in with
              the student number and password you submitted. Junior Officer applications stay hidden
              until then.
            </Body>
          }
        />
        <div style={{ marginTop: layout.gap }}>
          <Link href="/hero">
            <Button variant="outline">Back to the site</Button>
          </Link>
        </div>
      </Column>
    </Surface>
  );
}
