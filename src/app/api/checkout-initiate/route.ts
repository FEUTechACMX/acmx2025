import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
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

    // Create PayMongo GCash source
    const response = await axios.post(
      "https://api.paymongo.com/v1/sources",
      {
        data: {
          attributes: {
            amount: 10000, // ₱100 in centavos
            currency: "PHP",
            type: "gcash",
            redirect: {
              success: `${
                process.env.NEXT_PUBLIC_BASE_URL
              }/payment-success?payload=${encodeURIComponent(
                JSON.stringify(body)
              )}`,
              failed: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed`,
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
    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (error: unknown) {
    console.error("GCash source creation error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment." },
      { status: 500 }
    );
  }
}
