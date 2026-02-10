import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount } = body;

    const response = await axios.post(
      "https://api.paymongo.com/v1/sources",
      {
        data: {
          attributes: {
            amount,
            currency: "PHP",
            type: "gcash",
            redirect: {
              success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
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
    return NextResponse.json({ checkout_url: checkoutUrl }, { status: 200 });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios error (create-gcash-source):",
        error.response?.data || error.message
      );
      return NextResponse.json(
        {
          error: "Failed to create GCash source",
          details: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }

    if (error instanceof Error) {
      console.error("Unexpected error (create-gcash-source):", error.message);
      return NextResponse.json(
        { error: "Unexpected server error", details: error.message },
        { status: 500 }
      );
    }

    console.error("Unknown error (create-gcash-source):", error);
    return NextResponse.json(
      { error: "Unknown error occurred." },
      { status: 500 }
    );
  }
}
