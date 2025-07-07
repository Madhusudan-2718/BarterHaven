# BarterHaven Location Features

This document provides comprehensive information about the location features implemented in BarterHaven, including setup instructions, troubleshooting, and usage guidelines.

## 🚀 Features Implemented

### 1. **Real-time Location Services**
- GPS location detection with high accuracy
- Location permission handling
- Reverse geocoding (coordinates to address)
- Forward geocoding (address to coordinates)
- Location watching for real-time updates

### 2. **Location-based Item Filtering**
- Filter items by proximity to user location
- Configurable search radius (5km to 100km)
- Distance calculation using Haversine formula
- Server-side and client-side filtering options

### 3. **Interactive Maps**
- MapView integration with react-native-maps
- Location selection via map taps
- User location display
- Item location markers
- Distance visualization

### 4. **Location Components**
- **LocationPicker**: For selecting item locations during upload
- **LocationFilter**: For filtering items by proximity
- **ItemLocation**: For displaying item locations with distance

### 5. **Database Integration**
- Location data storage in Supabase
- User location tracking
- Item location association
- Location-based queries

## 📋 Prerequisites

### Required Software
1. **Node.js** (v16 or higher)
2. **Java JDK** (v11 or higher) - Required for Android development
3. **Android Studio** - For Android SDK and emulator
4. **Git Bash** - For running commands (recommended)

### Required Accounts
1. **Expo Account** - For development builds
2. **Supabase Account** - For database and storage

## 🔧 Setup Instructions

### Step 1: Install Java JDK
```bash
# Download and install Java JDK 11 or higher
# Windows: Download from Oracle or use OpenJDK
# macOS: brew install openjdk@11
# Linux: sudo apt install openjdk-11-jdk
```

### Step 2: Install Android Studio
1. Download Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Install with default settings
3. Open Android Studio and complete the setup wizard
4. Install Android SDK (API level 33 or higher)

### Step 3: Set Environment Variables
```bash
# Windows (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11.0.x"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

# macOS/Linux
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.0.x.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

### Step 4: Install Project Dependencies
```bash
# Navigate to project directory
cd BarterHaven

# Install dependencies
npm install

# Install specific location packages
npx expo install expo-location react-native-maps
```

### Step 5: Configure Location Permissions

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

#### iOS (app.json)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow BarterHaven to use your location to find items near you.",
          "locationAlwaysPermission": "Allow BarterHaven to use your location in the background.",
          "locationWhenInUsePermission": "Allow BarterHaven to use your location to find items near you."
        }
      ]
    ]
  }
}
```

### Step 6: Build and Link Native Modules
```bash
# Create development build
npx expo run:android

# Or for iOS
npx expo run:ios
```

## 🗄️ Database Setup

### Run Location Migration
```bash
# Apply the location migration to Supabase
# The migration file is located at: supabase/migrations/20240317_add_location_fields_v2.sql
```

### Verify Database Functions
```bash
# Test the location functions in Supabase SQL editor
SELECT bh_calculate_haversine_distance(37.78825, -122.4324, 37.78925, -122.4334);
SELECT bh_find_items_within_radius(37.78825, -122.4324, 50);
```

## 🚀 Running the App

### Development Mode
```bash
# Start the development server
npx expo start

# Press 'a' for Android or 'i' for iOS
```

### Production Build
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. **"Cannot find native module 'ExpoLocation'"**
**Cause**: Native modules not properly linked
**Solution**:
```bash
# Clear cache and reinstall
npx expo install --fix
npx expo run:android
```

#### 2. **"Cannot find native module 'RNMapsAirModule'"**
**Cause**: react-native-maps not properly linked
**Solution**:
```bash
# Reinstall maps package
npm uninstall react-native-maps
npx expo install react-native-maps
npx expo run:android
```

#### 3. **Location permissions not working**
**Cause**: Permissions not properly configured
**Solution**:
- Check AndroidManifest.xml for location permissions
- Verify app.json configuration
- Test on physical device (emulator may not support GPS)

#### 4. **Maps not displaying**
**Cause**: Google Maps API key missing or invalid
**Solution**:
```bash
# Add Google Maps API key to app.json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

#### 5. **Step indicator UI issues**
**Cause**: Layout overflow or styling conflicts
**Solution**:
- Check step indicator styles in upload.jsx
- Ensure proper flex layout
- Test on different screen sizes

#### 6. **Database functions not working**
**Cause**: Migration not applied or function conflicts
**Solution**:
```sql
-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS calculate_distance(numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS find_items_within_radius(numeric, numeric, numeric);

-- Apply the migration again
-- Check supabase/migrations/20240317_add_location_fields_v2.sql
```

### Performance Optimization

#### 1. **Location Accuracy Settings**
```javascript
// High accuracy for precise location
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
  timeInterval: 5000,
  distanceInterval: 10,
});

// Balanced accuracy for better performance
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 10000,
  distanceInterval: 50,
});
```

#### 2. **Caching Location Data**
```javascript
// Cache user location to reduce API calls
const cachedLocation = await AsyncStorage.getItem('userLocation');
if (cachedLocation) {
  return JSON.parse(cachedLocation);
}
```

## 📱 Usage Guidelines

### For Users
1. **Enable Location Services**: Allow location permissions when prompted
2. **Set Item Location**: Use the location picker when uploading items
3. **Filter by Distance**: Use location filter to find nearby items
4. **View Item Locations**: Tap "View Map" to see item locations

### For Developers
1. **Location Service**: Use `LocationService` class for all location operations
2. **Components**: Use provided location components for consistent UI
3. **Error Handling**: Always handle location permission denials gracefully
4. **Fallbacks**: Provide manual input options when GPS is unavailable

## 🔒 Privacy and Security

### Data Protection
- Location data is stored securely in Supabase
- User consent required for location access
- Location data can be deleted by users
- No location tracking without explicit permission

### Best Practices
- Request location only when needed
- Provide clear explanations for location usage
- Allow users to disable location features
- Implement proper error handling for permission denials

## 📞 Support

### Getting Help
1. Check this README for common issues
2. Review the troubleshooting section
3. Check Expo and React Native documentation
4. Contact the development team

### Useful Resources
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Supabase Documentation](https://supabase.com/docs)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

---

**Note**: This implementation provides both native GPS functionality and fallback options for when native modules are not available. The app will gracefully degrade to manual location input when GPS services are unavailable. 