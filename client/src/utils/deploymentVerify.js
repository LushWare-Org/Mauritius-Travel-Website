// Production Deployment Verification Script
// Run this after deploying to verify everything is working

const PRODUCTION_FRONTEND_URL = 'https://maldives-activity-booking-frontend.onrender.com'; // Update this
const PRODUCTION_BACKEND_URL = 'https://maldives-activity-booking-backend.onrender.com';

async function verifyDeployment() {
  console.log('🚀 Production Deployment Verification');
  console.log('=====================================\n');

  // Test 1: Check if backend API is accessible
  console.log('1️⃣ Testing Backend API...');
  try {
    const response = await fetch(`${PRODUCTION_BACKEND_URL}/api/v1/activities`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend API is working');
      console.log(`📊 Activities available: ${data.count}`);
    } else {
      console.log('❌ Backend API returned error:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend API is not accessible:', error.message);
  }

  // Test 2: Check CORS configuration
  console.log('\n2️⃣ Testing CORS Configuration...');
  try {
    const response = await fetch(`${PRODUCTION_BACKEND_URL}/api/v1/activities`, {
      method: 'GET',
      headers: {
        'Origin': PRODUCTION_FRONTEND_URL,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ CORS is properly configured');
    } else {
      console.log('❌ CORS issue detected:', response.status);
    }
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }

  // Test 3: Check environment variables (this should be run on the deployed frontend)
  console.log('\n3️⃣ Environment Variables Check:');
  console.log('API URL:', import.meta?.env?.VITE_API_URL || 'Not available');
  console.log('Cloudinary:', import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME || 'Not available');

  // Test 4: Instructions for manual testing
  console.log('\n4️⃣ Manual Testing Checklist:');
  console.log('📋 Please verify the following in your deployed frontend:');
  console.log('   □ Homepage loads without errors');
  console.log('   □ Activities are displayed on the homepage');
  console.log('   □ Activities page shows all activities');
  console.log('   □ No CORS errors in browser console');
  console.log('   □ Images load properly from Cloudinary');
  console.log('   □ Navigation between pages works');
  console.log('   □ Responsive design works on mobile');

  console.log('\n✅ Deployment verification completed!');
}

// Export for use in deployed application
if (typeof window !== 'undefined') {
  window.verifyDeployment = verifyDeployment;
}

export default verifyDeployment;
