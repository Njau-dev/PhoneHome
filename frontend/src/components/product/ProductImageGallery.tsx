"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="flex-1 flex flex-col-reverse gap-3">
      {/* Thumbnail Images */}
      <div className="flex overflow-x-auto gap-3 w-full">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image || "/assets/logo.png"}
            alt={`${productName} ${index + 1}`}
            width={160}
            height={160}
            unoptimized
            onClick={() => setSelectedImage(image)}
            className={`w-[24%] md:w-[15%] shrink-0 cursor-pointer rounded-xl border-2 transition-all ${selectedImage === image ? "border-accent" : "border-transparent"
              }`}
          />
        ))}
      </div>

      {/* Main Image */}
      <div className="w-full sm:w-[95%]">
        <Image
          src={selectedImage || "/assets/logo.png"}
          alt={productName}
          width={900}
          height={900}
          unoptimized
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
