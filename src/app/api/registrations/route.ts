import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "../../../../lib/prisma";
import { RegistrationRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      userId,
      fullName,
      studentNumber,
      schoolEmail,
      contactNumber,
      facebookLink,
      yearLevel,
      section,
      professor,
      degreeProgram,
    } = body;

    // 1️⃣ Duplicate check
    if (userId) {
      const existing = await prisma.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "You are already registered for this event." },
          { status: 409 }
        );
      }
    } else {
      const existing = await prisma.registration.findFirst({
        where: {
          eventId,
          OR: [{ schoolEmail }, { studentNumber }],
        },
      });
      if (existing) {
        return NextResponse.json(
          {
            error:
              "This email/student number is already registered for this event.",
          },
          { status: 409 }
        );
      }
    }

    // 2️⃣ Create registration record
    const registration = await prisma.registration.create({
      data: {
        userId: userId || null,
        eventId,
        fullName,
        studentNumber,
        schoolEmail,
        contactNumber,
        facebookLink,
        yearLevel: parseInt(yearLevel, 10),
        section,
        professor,
        degreeProgram,
        role: userId ? RegistrationRole.MEMBER : RegistrationRole.NON_MEMBER,
      },
    });

    // 3️⃣ If non-member → generate PayMongo GCash link
    if (!userId) {
      const response = await axios.post(
        "https://api.paymongo.com/v1/sources",
        {
          data: {
            attributes: {
              amount: 10000, // ₱100 in centavos
              currency: "PHP",
              type: "gcash",
              redirect: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?registrationId=${registration.id}`,
                failed: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed?registrationId=${registration.id}`,
              },
              metadata: {
                registrationId: registration.id,
                fullName,
                schoolEmail,
              },
            },
          },
        },
        {
          auth: {
            username: process.env.PAYMONGO_SECRET_KEY || "",
            password: "",
          },
        }
      );

      const checkoutUrl = response.data.data.attributes.redirect.checkout_url;

      return NextResponse.json({ checkout_url: checkoutUrl }, { status: 200 });
    }

    // 4️⃣ For members (no payment required)
    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error(
      "Error creating registration:",
      error.response?.data || error
    );
    return NextResponse.json(
      {
        error: "Something went wrong while registering.",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
