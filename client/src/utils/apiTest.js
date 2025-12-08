// API Test Script
// Run this in the browser console to test API endpoints

async function testAPI() {
    const API_URL = 'http://localhost:5000/api/v1';
    
    console.log('🧪 Testing API endpoints...');
    
    try {
        // Test activities endpoint
        console.log('📊 Testing /activities endpoint...');
        const activitiesResponse = await fetch(`${API_URL}/activities`);
        const activitiesData = await activitiesResponse.json();
        
        if (activitiesData.success) {
            console.log('✅ Activities endpoint working');
            console.log(`📈 Found ${activitiesData.count} activities`);
            console.log('📋 Sample activity:', activitiesData.data[0]);
        } else {
            console.error('❌ Activities endpoint failed:', activitiesData);
        }
        
        // Test individual activity endpoint
        if (activitiesData.data && activitiesData.data.length > 0) {
            const firstActivityId = activitiesData.data[0]._id;
            console.log(`📊 Testing /activities/${firstActivityId} endpoint...`);
            
            const activityResponse = await fetch(`${API_URL}/activities/${firstActivityId}`);
            const activityData = await activityResponse.json();
            
            if (activityData.success) {
                console.log('✅ Individual activity endpoint working');
                console.log('📋 Activity details:', activityData.data);
            } else {
                console.error('❌ Individual activity endpoint failed:', activityData);
            }
        }
        
    } catch (error) {
        console.error('💥 API test failed:', error);
    }
}

// Run the test
testAPI();
