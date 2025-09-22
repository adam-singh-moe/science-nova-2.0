import { NextRequest, NextResponse } from "next/server"
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from "@/lib/server-supabase"

export async function GET(req: NextRequest) {
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
    
    // Get params
    const url = new URL(req.url)
    const grade = url.searchParams.get("grade")
    const type = url.searchParams.get("type") // curriculum or textbook
    
    // Fetch all grade folders from both buckets
    const [curriculumResponse, textbooksResponse] = await Promise.all([
      type !== "textbook" ? supabase.storage.from('Curriculums').list() : { data: [] },
      type !== "curriculum" ? supabase.storage.from('textbook_content').list() : { data: [] }
    ])
    
    const allDocs = []
    
    // Process curriculum documents
    if (curriculumResponse.data) {
      for (const folder of curriculumResponse.data) {
        if (folder.name.startsWith('grade_')) {
          const folderGrade = parseInt(folder.name.replace('grade_', ''))
          
          // Skip if we're filtering by grade and this isn't the requested grade
          if (grade && parseInt(grade) !== folderGrade) {
            continue
          }
          
          // Get files within each grade folder
          const { data: gradeFiles } = await supabase.storage
            .from('Curriculums')
            .list(folder.name)
          
          if (gradeFiles) {
            for (const file of gradeFiles) {
              if (file.name.endsWith('.pdf')) {
                // Generate both public URL and signed URL as fallback
                const publicUrl = supabase.storage
                  .from('Curriculums')
                  .getPublicUrl(`${folder.name}/${file.name}`).data.publicUrl
                
                // Create a signed URL as fallback (expires in 1 hour)
                const { data: signedUrl } = await supabase.storage
                  .from('Curriculums')
                  .createSignedUrl(`${folder.name}/${file.name}`, 3600)
                
                allDocs.push({
                  name: file.name,
                  type: 'curriculum',
                  url: signedUrl?.signedUrl || publicUrl,
                  publicUrl,
                  signedUrl: signedUrl?.signedUrl,
                  grade: folderGrade,
                  path: `${folder.name}/${file.name}`,
                  bucket: 'Curriculums'
                })
              }
            }
          }
        }
      }
    }
    
    // Process textbook documents
    if (textbooksResponse.data) {
      for (const folder of textbooksResponse.data) {
        if (folder.name.startsWith('grade_')) {
          const folderGrade = parseInt(folder.name.replace('grade_', ''))
          
          // Skip if we're filtering by grade and this isn't the requested grade
          if (grade && parseInt(grade) !== folderGrade) {
            continue
          }
          
          // Get files within each grade folder
          const { data: gradeFiles } = await supabase.storage
            .from('textbook_content')
            .list(folder.name)
          
          if (gradeFiles) {
            for (const file of gradeFiles) {
              if (file.name.endsWith('.pdf')) {
                // Generate both public URL and signed URL as fallback
                const publicUrl = supabase.storage
                  .from('textbook_content')
                  .getPublicUrl(`${folder.name}/${file.name}`).data.publicUrl
                
                // Create a signed URL as fallback (expires in 1 hour)
                const { data: signedUrl } = await supabase.storage
                  .from('textbook_content')
                  .createSignedUrl(`${folder.name}/${file.name}`, 3600)
                
                allDocs.push({
                  name: file.name,
                  type: 'textbook',
                  url: signedUrl?.signedUrl || publicUrl,
                  publicUrl,
                  signedUrl: signedUrl?.signedUrl,
                  grade: folderGrade,
                  path: `${folder.name}/${file.name}`,
                  bucket: 'textbook_content'
                })
              }
            }
          }
        }
      }
    }
    
    // Sort documents by grade and then by type
    allDocs.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade
      return a.type.localeCompare(b.type)
    })
    
    return NextResponse.json({ documents: allDocs })
  } catch (error) {
    console.error("Error in documents API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
