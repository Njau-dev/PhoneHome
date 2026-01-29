"use client";

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
          <img
            key={index}
            src={image}
            alt={`${productName} ${index + 1}`}
            onClick={() => setSelectedImage(image)}
            className={`w-[24%] md:w-[15%] shrink-0 cursor-pointer rounded-xl border-2 transition-all ${selectedImage === image ? "border-accent" : "border-transparent"
              }`}
          />
        ))}
      </div>

      {/* Main Image */}
      <div className="w-full sm:w-[80%]">
        <img
          src={selectedImage}
          alt={productName}
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
