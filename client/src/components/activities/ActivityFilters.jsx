import React from 'react';

const ActivityFilters = ({ filters, onFilterChange }) => {
    // Price presets for easier filtering (in Rupees)
    const pricePresets = [
        { label: 'All', range: [0, 50000] },
        { label: 'Under ₹1000', range: [0, 1000] },
        { label: '₹1000 - ₹5000', range: [1000, 5000] },
        { label: '₹5000 - ₹15000', range: [5000, 15000] },
        { label: '₹15000+', range: [15000, 50000] }
    ];

    // Alternative Euro presets (if you want to switch between currencies)
    const euroPricePresets = [
        { label: 'All', range: [0, 500] },
        { label: 'Under €10', range: [0, 10] },
        { label: '€10 - €50', range: [10, 50] },
        { label: '€50 - €150', range: [50, 150] },
        { label: '€150+', range: [150, 500] }
    ];

    // Use filters prop directly
    const { priceRange, currency = '₹' } = filters;

    // Get active presets based on currency
    const activePresets = currency === '€' ? euroPricePresets : pricePresets;
    const maxRange = currency === '€' ? 500 : 50000;

    // Handle price range change
    const handlePriceChange = (e, index) => {
        const newPriceRange = [...priceRange];
        newPriceRange[index] = parseInt(e.target.value);
        
        // Ensure min <= max
        if (index === 0 && newPriceRange[0] > newPriceRange[1]) {
            newPriceRange[0] = newPriceRange[1];
        } else if (index === 1 && newPriceRange[1] < newPriceRange[0]) {
            newPriceRange[1] = newPriceRange[0];
        }
        
        // Update parent immediately
        onFilterChange({ ...filters, priceRange: newPriceRange });
    };
    
    // Handle direct input for price range
    const handlePriceInput = (e, index) => {
        const value = parseInt(e.target.value) || 0;
        const newPriceRange = [...priceRange];
        
        if (index === 0) {
            newPriceRange[0] = Math.min(value, newPriceRange[1]);
        } else {
            newPriceRange[1] = Math.max(value, newPriceRange[0]);
        }
        
        // Update parent immediately
        onFilterChange({ ...filters, priceRange: newPriceRange });
    };
    
    // Apply price preset
    const applyPricePreset = (preset) => {
        onFilterChange({ ...filters, priceRange: [...preset.range] });
    };

    // Format currency symbol display
    const getCurrencySymbol = () => {
        return currency === '€' ? '€' : '₹';
    };

    return (
        <div className="bg-white rounded-lg shadow p-5 sticky top-24">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-blue-800">Filters</h2>
            </div>

            {/* Currency Toggle (Optional) */}
            {filters.hasOwnProperty('currency') && (
                <div className="mb-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onFilterChange({ ...filters, currency: '₹' })}
                            className={`px-3 py-1 text-sm rounded ${
                                currency === '₹' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            ₹ Rupees
                        </button>
                        <button
                            onClick={() => onFilterChange({ ...filters, currency: '€' })}
                            className={`px-3 py-1 text-sm rounded ${
                                currency === '€' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            € Euro
                        </button>
                    </div>
                </div>
            )}

            {/* Price Range Filter */}
            <div className="mb-8">
                <h3 id="price-range-label" className="font-medium mb-3 text-gray-800">
                    Price Range ({getCurrencySymbol()})
                </h3>
                
                {/* Price presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {activePresets.map((preset, index) => (
                        <button
                            key={index}
                            onClick={() => applyPricePreset(preset)}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1]
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                
                <div className="px-2">
                    {/* Price input fields */}
                    <div className="flex justify-between mb-4">
                        <div className="relative w-20">
                            <label htmlFor="min-price" className="sr-only">Minimum Price</label>
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                                {getCurrencySymbol()}
                            </span>
                            <input
                                id="min-price"
                                type="number"
                                min="0"
                                max={maxRange}
                                value={priceRange[0]}
                                onChange={(e) => handlePriceInput(e, 0)}
                                className="w-full pl-6 pr-2 py-1 border rounded text-sm"
                                aria-label="Minimum price"
                                placeholder="Min"
                            />
                        </div>
                        <span className="self-center text-gray-500">to</span>
                        <div className="relative w-20">
                            <label htmlFor="max-price" className="sr-only">Maximum Price</label>
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                                {getCurrencySymbol()}
                            </span>
                            <input
                                id="max-price"
                                type="number"
                                min="0"
                                max={maxRange}
                                value={priceRange[1]}
                                onChange={(e) => handlePriceInput(e, 1)}
                                className="w-full pl-6 pr-2 py-1 border rounded text-sm"
                                aria-label="Maximum price"
                                placeholder="Max"
                            />
                        </div>
                    </div>
                    
                    {/* Price slider */}
                    <div className="relative mb-4 h-2 bg-gray-200 rounded">
                        <div 
                            className="absolute h-2 bg-blue-500 rounded" 
                            style={{
                                left: `${(priceRange[0] / maxRange) * 100}%`, 
                                width: `${((priceRange[1] - priceRange[0]) / maxRange) * 100}%`
                            }}
                        ></div>
                    </div>
                    <div className="relative">
                        <label htmlFor="price-min-slider" className="sr-only">Minimum price slider</label>
                        <input
                            id="price-min-slider"
                            type="range"
                            min="0"
                            max={maxRange}
                            step={currency === '€' ? 5 : 500}
                            value={priceRange[0]}
                            onChange={(e) => handlePriceChange(e, 0)}
                            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer"
                            aria-labelledby="price-range-label"
                            aria-valuemin="0"
                            aria-valuemax={maxRange}
                            aria-valuenow={priceRange[0]}
                        />
                        <label htmlFor="price-max-slider" className="sr-only">Maximum price slider</label>
                        <input
                            id="price-max-slider"
                            type="range"
                            min="0"
                            max={maxRange}
                            step={currency === '€' ? 5 : 500}
                            value={priceRange[1]}
                            onChange={(e) => handlePriceChange(e, 1)}
                            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer"
                            aria-labelledby="price-range-label"
                            aria-valuemin="0"
                            aria-valuemax={maxRange}
                            aria-valuenow={priceRange[1]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFilters;