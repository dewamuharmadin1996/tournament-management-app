"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { put } from "@vercel/blob"

interface ImageUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  aspectRatio?: "square" | "video" | "auto"
}

export function ImageUpload({ label, value, onChange, aspectRatio = "auto" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const blob = await put(file.name, file, {
        access: "public",
      })

      onChange(blob.url)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "max-h-32",
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter URL or upload file"
          className="bg-background/50"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        {value && (
          <Button type="button" variant="outline" size="icon" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <div className="mt-2 p-4 bg-muted/20 rounded-lg flex items-center justify-center">
          <img
            src={value || "/placeholder.svg"}
            alt="Preview"
            className={`object-contain rounded ${aspectClasses[aspectRatio]}`}
          />
        </div>
      )}
    </div>
  )
}
