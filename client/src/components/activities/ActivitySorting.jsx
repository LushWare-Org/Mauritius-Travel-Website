import React, { useState, useRef, useEffect } from 'react';

const ActivitySorting = ({ sortOption, onSortChange }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const sortOptions = [
        { value: 'popularity', label: 'Most Popular', icon: '🔥' },
        { value: 'price-asc', label: 'Price: Low to High', icon: '💰' },
        { value: 'price-desc', label: 'Price: High to Low', icon: '💎' },
        { value: 'duration', label: 'Shortest Duration', icon: '⏱️' },
        { value: 'rating', label: 'Highest Rated', icon: '⭐' },
        { value: 'newest', label: 'Newest First', icon: '🆕' }
    ];
    
    const currentOption = sortOptions.find(option => option.value === sortOption) || sortOptions[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value) => {
        onSortChange(value);
        setDropdownOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium hidden sm:inline">
                    Sort by:
                </span>
                
                {/* Mobile trigger - Icon only */}
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="sm:hidden p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    aria-label="Sort options"
                >
                    <span className="text-blue-600 font-bold text-lg">⇅</span>
                </button>

                {/* Desktop trigger */}
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="hidden sm:flex items-center justify-between w-64 bg-white border border-blue-200 rounded-xl px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{currentOption.icon}</span>
                        <div className="text-left">
                            <p className="text-sm text-gray-500 font-medium">Sort by</p>
                            <p className="text-gray-900 font-semibold">{currentOption.label}</p>
                        </div>
                    </div>
                    <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fadeIn">
                    {/* Arrow */}
                    <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Sort Activities</h3>
                        <p className="text-sm text-gray-500 mt-1">Choose your preferred sorting method</p>
                    </div>
                    
                    {/* Options List */}
                    <div className="p-2">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`flex items-center w-full p-4 rounded-lg mb-1 transition-all duration-200 ${
                                    sortOption === option.value
                                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                                    sortOption === option.value
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <span className="text-lg">{option.icon}</span>
                                </div>
                                
                                <div className="flex-1 text-left">
                                    <p className={`font-semibold ${
                                        sortOption === option.value ? 'text-blue-700' : 'text-gray-900'
                                    }`}>
                                        {option.label}
                                    </p>
                                </div>
                                
                                {sortOption === option.value && (
                                    <div className="ml-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleSelect('popularity')}
                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                Reset to Popular
                            </button>
                            <button
                                onClick={() => setDropdownOpen(false)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Apply Sort
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add custom animation
const styles = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
}
`;

export default ActivitySorting;