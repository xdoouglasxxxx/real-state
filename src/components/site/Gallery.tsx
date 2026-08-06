"use client";
import { useState } from "react";

export default function Gallery({ images, title, badge }: { images: string[]; title: string; badge: string }) {
  const [main, setMain] = useState(images[0]);
  return (
    <div>
      <div className="detail-main-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={title} />
        <span className="badge">{badge}</span>
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((src) => (
            <button key={src} className={"thumb" + (src === main ? " on" : "")} onClick={() => setMain(src)} aria-label="Ver foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
