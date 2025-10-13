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

    // 🔹 1. Duplicate check
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

    // 🔹 2. Create registration record
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

    // 🔹 3. Non-member → create GCash link
    if (!userId) {
      const response = await axios.post(
        "https://api.paymongo.com/v1/sources",
        {
          data: {
            attributes: {
              amount: 10000,
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

    // 🔹 4. Members → just register (no payment)
    return NextResponse.json(registration, { status: 201 });
  } catch (error: unknown) {
    // ✅ Type-safe error handling
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios error (registrations):",
        error.response?.data || error.message
      );
      return NextResponse.json(
        {
          error: "PayMongo API request failed.",
          details: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }

    if (error instanceof Error) {
      console.error("Unexpected error (registrations):", error.message);
      return NextResponse.json(
        { error: "Unexpected server error.", details: error.message },
        { status: 500 }
      );
    }

    console.error("Unknown error (registrations):", error);
    return NextResponse.json(
      { error: "Unknown error occurred." },
      { status: 500 }
    );
  }
}
