// Example usage of MultimediaUploader component in different contexts

import { MultimediaUploader } from "@/components/multimedia-uploader";
import { useState } from "react";

type MultimediaFile = {
  id: string;
  file: File;
  type: "image" | "video" | "interactive";
  url: string;
  name: string;
};

// Example 1: Images only uploader
export function ImageUploader() {
  const [, setImages] = useState<MultimediaFile[]>([]);

  return (
    <MultimediaUploader
      onFilesChange={setImages}
      maxFiles={5}
      allowedTypes={["images"]}
      className="w-full"
    />
  );
}

// Example 2: Videos only uploader
export function VideoUploader() {
  const [, setVideos] = useState<MultimediaFile[]>([]);

  return (
    <MultimediaUploader
      onFilesChange={setVideos}
      maxFiles={3}
      allowedTypes={["videos"]}
      className="w-full"
    />
  );
}

// Example 3: Interactive content only uploader
export function InteractiveContentUploader() {
  const [, setInteractiveFiles] = useState<MultimediaFile[]>([]);

  return (
    <MultimediaUploader
      onFilesChange={setInteractiveFiles}
      maxFiles={1}
      allowedTypes={["interactive"]}
      className="w-full"
    />
  );
}

// Example 4: All types with custom settings
export function FullMultimediaUploader() {
  const [, setAllFiles] = useState<MultimediaFile[]>([]);

  return (
    <MultimediaUploader
      onFilesChange={setAllFiles}
      maxFiles={20}
      allowedTypes={["images", "videos", "interactive"]}
      className="w-full"
      disabled={false}
    />
  );
}

// Example 5: Future text editor integration
export function TextEditorWithMedia() {
  const [, setMediaFiles] = useState<MultimediaFile[]>([]);

  return (
    <div className="space-y-4">
      {/* Text editor would go here */}
      <textarea
        placeholder="Enter your text content..."
        className="h-32 w-full rounded-md border px-3 py-2"
      />

      {/* Multimedia uploader for adding media to text */}
      <div>
        <label className="text-sm font-medium">Add Media</label>
        <MultimediaUploader
          onFilesChange={setMediaFiles}
          maxFiles={5}
          allowedTypes={["images", "videos"]}
          className="mt-2"
        />
      </div>
    </div>
  );
}
