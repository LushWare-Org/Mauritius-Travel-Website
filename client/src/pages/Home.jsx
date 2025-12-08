import React from 'react';
import HeroSection from '../components/home/HeroSection';
import PopularActivities from '../components/home/PopularActivities';
import TourPackages from '../components/home/TourPackages';
import AirportTransferTab from '../components/home/AirportTransferTab'; // New component
import Testimonials from '../components/home/Testimonials';
import ErrorBoundary from '../components/common/ErrorBoundary';

const Home = () => {
    return (
        <div className="bg-gradient-to-b from-white via-blue-50/30 to-white">
            <HeroSection />
            
            {/* Airport Transfer Tab */}
            <ErrorBoundary>
                <AirportTransferTab />
            </ErrorBoundary>
            
            {/* Tour Packages */}
            <ErrorBoundary>
                <TourPackages />
            </ErrorBoundary>
            
            <ErrorBoundary>
                <PopularActivities />
            </ErrorBoundary>
            
            {/*<div className="container mx-auto px-4">
                <Testimonials />
            </div>*/}
        </div>
    );
};

export default Home;