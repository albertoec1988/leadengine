// app/api/blob/upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"]

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Gate: solo un admin autenticado puede obtener un token de subida.
        const user = await getSessionUser()
        if (!user || user.role !== "admin") {
          throw new Error("No autorizado")
        }
        return {
          allowedContentTypes: ALLOWED,
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB por imagen
        }
      },
      // onUploadCompleted NO se usa para crear filas: no se dispara en localhost.
      // Las filas PropertyImage se crean vía la server action addImages tras upload().
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
