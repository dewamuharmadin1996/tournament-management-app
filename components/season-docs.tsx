"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/admin/image-upload"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SeasonDocs({ seasonId, canEdit }: { seasonId: string; canEdit: boolean }) {
  const prefix = `seasons/${seasonId}`
  const { data, isLoading, mutate } = useSWR<{ files: { url: string; pathname: string }[] }>(
    `/api/blob/list?prefix=${encodeURIComponent(prefix)}`,
    fetcher,
  )
  const [uploadUrl, setUploadUrl] = useState("")

  const handleUploaded = async (url: string) => {
    setUploadUrl(url)
    await mutate()
    setUploadUrl("")
  }

  const handleDelete = async (url: string) => {
    await fetch("/api/blob/delete", { method: "POST", body: JSON.stringify({ url }) })
    await mutate()
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-2">Add Photo</h3>
          <ImageUpload
            label="Upload"
            value={uploadUrl}
            onChange={handleUploaded}
            aspectRatio="auto"
            uploadPath={prefix}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading photos...
          </div>
        ) : data && data.files.length > 0 ? (
          data.files.map((f) => (
            <Card key={f.url} className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted/20">
                  <img src={f.url || "/placeholder.svg"} alt="Season document" className="w-full h-full object-cover" />
                </div>
                {canEdit && (
                  <div className="p-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleDelete(f.url)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full">No photos yet.</p>
        )}
      </div>
    </div>
  )
}
