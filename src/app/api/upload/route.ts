import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_ADMIN_ROLES } from "@/types/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// POST /api/upload — server-side upload to Supabase Storage (bypasses RLS)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !EVENT_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const bucket = formData.get("bucket") as string;
    const files = formData.getAll("files") as File[];

    if (!bucket || !["events", "eventCard"].includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 50MB limit` },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload "${file.name}": ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Upload API error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
