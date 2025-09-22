import { NextRequest, NextResponse } from "next/server"
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from "@/lib/server-supabase"

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization")
    const { userId } = getUserFromAuthHeader(authHeader)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has appropriate role
    const role = await getProfileRole(userId)
    if (!["TEACHER", "ADMIN", "DEVELOPER"].includes(role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
    
    // Parse form data
    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // "curriculum" or "textbook"
    const grade = formData.get("grade") as string
    
    if (!file || !type || !grade) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    if (!["curriculum", "textbook"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'curriculum' or 'textbook'" }, { status: 400 })
    }
    
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }
    
    const gradeNum = parseInt(grade)
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
      return NextResponse.json({ error: "Invalid grade. Must be between 1 and 12" }, { status: 400 })
    }
    
    // Determine bucket name
    const bucketName = type === "curriculum" ? "Curriculums" : "textbook_content"
    const folderName = `grade_${gradeNum}`
    const filePath = `${folderName}/${file.name}`
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)
    
    // Create grade folder if it doesn't exist (by uploading a placeholder)
    const { data: existingFiles } = await supabase.storage
      .from(bucketName)
      .list(folderName)
    
    if (!existingFiles || existingFiles.length === 0) {
      // Create folder by uploading a placeholder
      await supabase.storage
        .from(bucketName)
        .upload(`${folderName}/.emptyFolderPlaceholder`, new Uint8Array([]))
    }
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true // Overwrite if file already exists
      })
    
    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: "Failed to upload file: " + error.message }, { status: 500 })
    }
    
    // Generate URLs
    const publicUrl = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath).data.publicUrl
    
    const { data: signedUrl } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600)
    
    return NextResponse.json({ 
      success: true,
      data: {
        name: file.name,
        type,
        grade: gradeNum,
        path: filePath,
        bucket: bucketName,
        url: signedUrl || publicUrl,
        publicUrl,
        signedUrl
      }
    })
    
  } catch (error) {
    console.error("Error in documents upload API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a document
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const { userId } = getUserFromAuthHeader(authHeader)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const role = await getProfileRole(userId)
    if (!["ADMIN", "DEVELOPER"].includes(role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
    
    const { searchParams } = new URL(req.url)
    const bucket = searchParams.get("bucket")
    const path = searchParams.get("path")
    
    if (!bucket || !path) {
      return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 })
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) {
      console.error("Delete error:", error)
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Error in documents delete API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}