'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

export default function PhotoGallery({ photos, title = "Gallery" }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  return (
    <>
      <div>
        <h3 className="font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {photos.map((photo, index) => (
            <div
              key={index}
              onClick={() => setSelectedPhoto(photo)}
              className="flex-shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={photo.src}
                alt={photo.alt || `Photo ${index + 1}`}
                className="w-44 h-44 object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl p-0 border-0">
          <DialogTitle className="sr-only">View photo</DialogTitle>
          <div className="relative bg-black/80 rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 rounded-full p-1 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            {selectedPhoto && (
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.alt || "Enlarged photo"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
