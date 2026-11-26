import Image from "next/image";
import type { Photo as PhotoData } from "@/content/types";

/**
 * A card photo (globals.css .photo-frame): tinted to graphite and brass at
 * rest so a mixed set of photos, screenshots and stock images reads as one,
 * and full colour when its card (.project-card or .photo-host) is hovered or
 * focused. The frame sets the shape (pass an aspect-ratio class); the image
 * fills it, cropped at `photo.position`. next/image serves resized
 * AVIF/WebP copies and lazy-loads below the fold.
 */
export function Photo({
  photo,
  sizes,
  className = "",
  style,
}: {
  photo: PhotoData;
  sizes: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`photo-frame ${className}`} style={style}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        className="object-cover"
        style={photo.position ? { objectPosition: photo.position } : undefined}
      />
    </div>
  );
}
