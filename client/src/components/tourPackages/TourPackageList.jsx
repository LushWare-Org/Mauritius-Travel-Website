import React from 'react';
import TourPackageListItem from './TourPackageListItem';

const TourPackageList = ({ packages }) => {
    if (!packages || packages.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-lg text-gray-600">No tour packages match your current filters.</p>
                <p className="mt-2 text-blue-600">Try adjusting your filters to see more results.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {packages.map(pkg => (
                <TourPackageListItem key={pkg._id || pkg.id} pkg={pkg} />
            ))}
        </div>
    );
};

export default TourPackageList;
