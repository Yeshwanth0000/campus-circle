"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
        No photo
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <Image
          src={images[active]}
          alt={title}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 ring-2 transition ${
                i === active ? "ring-brand" : "ring-transparent hover:ring-slate-300"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
