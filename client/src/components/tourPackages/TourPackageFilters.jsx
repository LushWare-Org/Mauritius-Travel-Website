import React, { useState, useEffect } from 'react';

const TourPackageFilters = ({ filters, onFilterChange }) => {
    const pricePresets = [
        { label: 'All', range: [0, 100000] }, // big max
        { label: 'Under 3000', range: [0, 3000] },
        { label: '3000 - 5000', range: [3000, 5000] },
        { label: '5000+', range: [5000, 100000] }
    ];

    const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 100000]);

    useEffect(() => {
        if (filters.priceRange &&
            (filters.priceRange[0] !== priceRange[0] ||
             filters.priceRange[1] !== priceRange[1])) {
            setPriceRange(filters.priceRange);
        }
    }, [filters.priceRange]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            onFilterChange({ priceRange });
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [priceRange]);

    const handlePriceInput = (e, index) => {
        const value = parseInt(e.target.value) || 0;
        const newPriceRange = [...priceRange];
        if (index === 0) newPriceRange[0] = Math.min(value, newPriceRange[1]);
        else newPriceRange[1] = Math.max(value, newPriceRange[0]);
        setPriceRange(newPriceRange);
    };

    const resetFilters = () => {
        const resetRange = [0, 100000];
        setPriceRange(resetRange);
        onFilterChange({ priceRange: resetRange });
    };

    return (
        <div className="bg-white rounded-lg shadow p-5 sticky top-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-blue-800">Filters</h2>
                <button 
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Reset All
                </button>
            </div>

            <div className="mb-6">
                <h3 className="font-medium mb-3 text-gray-800">Price Range (Rs)</h3>
                <div className="flex justify-between mb-2">
                    <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceInput(e, 0)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceInput(e, 1)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                    />
                </div>
            </div>
        </div>
    );
};

export default TourPackageFilters;
