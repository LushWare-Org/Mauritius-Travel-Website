import React, { useState } from 'react';

const TourPackageImageGallery = ({ pkg }) => {
    if (!pkg) return null;

    // SAFE image formatter
    const formatImage = (img) => {
        if (!img) return 'https://via.placeholder.com/800x600?text=No+Image';

        // BASE64 IMAGE? return EXACT as-is
        if (img.startsWith("data:image")) {
            return img; 
        }

        // NORMAL URL? Safe
        return img;
};

    const mainImg = formatImage(pkg.image);
    const [mainImage, setMainImage] = useState(mainImg);

    // Build gallery array safely
    let images = [formatImage(pkg.image)];

    if (pkg.galleryImages && pkg.galleryImages.length > 0) {
        images = [pkg.image, ...pkg.galleryImages].map(formatImage);
    } else {
        images = [
            formatImage(pkg.image),
            `https://source.unsplash.com/random/800x600?tour,${pkg.destination},1`,
            `https://source.unsplash.com/random/800x600?tour,${pkg.destination},2`,
            `https://source.unsplash.com/random/800x600?tour,${pkg.destination},3`,
            `https://source.unsplash.com/random/800x600?tour,${pkg.destination},4`,
        ];
    }

    return (
        <div className="bg-gray-900">
            <div className="container mx-auto">

                {/* Main Image */}
                <div className="h-96 md:h-[500px] overflow-hidden relative">
                    <img
                        src={mainImage}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 opacity-50"></div>
                </div>

                {/* Thumbnails */}
                <div className="bg-gray-800 p-2">
                    <div className="flex overflow-x-auto space-x-2 pb-2 hide-scrollbar">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className={`flex-none w-20 h-16 cursor-pointer border-2 ${
                                    mainImage === img ? 'border-blue-500' : 'border-transparent'
                                }`}
                                onClick={() => setMainImage(img)}
                            >
                                <img
                                    src={img}
                                    alt={`${pkg.title} view ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TourPackageImageGallery;
