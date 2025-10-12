import axios, { AxiosResponse } from "axios";

interface PayMongoSourceResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      currency: string;
      redirect: {
        checkout_url: string;
        success: string;
        failed: string;
      };
      status: string;
      type: string;
    };
  };
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { amount } = body as { amount: number }; // amount in centavos (₱1.00 = 100)

    // ✅ Fix: redirect URLs must be string URLs, not console.log calls
    const response: AxiosResponse<PayMongoSourceResponse> = await axios.post(
      "https://api.paymongo.com/v1/sources",
      {
        data: {
          attributes: {
            amount,
            currency: "PHP",
            type: "gcash",
            redirect: {
              success: "https://example.com/success",
              failed: "https://example.com/failed",
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

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("PayMongo API Error:", error.response?.data || error.message);

    return new Response(
      JSON.stringify({
        error: "Failed to create GCash source",
        details: error.response?.data || error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
