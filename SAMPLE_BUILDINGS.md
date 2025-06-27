# Sample Building Helpers

This module provides utilities to quickly add sample buildings to the ThreeJS scene for testing and demonstration purposes.

## Files Created

- `src/utils/addSampleBuilding.ts` - Core functions for creating sample buildings
- `src/hooks/useSampleBuildings.ts` - React hook for component integration
- `src/components/SampleBuildingsToolbar.tsx` - UI component with buttons
- `src/utils/sampleBuildingHelpers.ts` - Browser console helpers

## Quick Usage

### 1. Browser Console (Easiest for Testing)

After the app initializes the helpers, you can use these functions in the browser console:

```javascript
// Add a single pentagon building at the origin
addSamplePentagonBuilding()

// Add an office building (taller, more windows)
addSampleOfficeBuilding()

// Add a residential building (shorter, fewer windows)
addSampleResidentialBuilding()

// Add multiple buildings in a grid (default: 3 buildings)
addMultipleSampleBuildings(5)

// List all sample buildings created
listSampleBuildings()

// Clear sample building references
clearSampleBuildings()
```

### 2. From React Components

```tsx
import { useSampleBuildings } from '../hooks/useSampleBuildings';

function MyComponent({ buildingService, windowService, addBuilding }) {
  const { createSamplePentagon, createSampleOfficeBuilding } = useSampleBuildings({
    buildingService,
    windowService,
    addBuilding
  });

  const handleAddBuilding = () => {
    createSamplePentagon();
  };

  return <button onClick={handleAddBuilding}>Add Pentagon</button>;
}
```

### 3. Using the Toolbar Component

```tsx
import { SampleBuildingsToolbar } from '../components/SampleBuildingsToolbar';

function App() {
  return (
    <SampleBuildingsToolbar
      buildingService={buildingService}
      windowService={windowService}
      addBuilding={addBuildingToManager}
    />
  );
}
```

### 4. Direct Function Calls

```typescript
import { addSampleBuilding } from '../utils/addSampleBuilding';

const building = addSampleBuilding(buildingService, windowService, {
  centerX: 0,
  centerZ: 0,
  radius: 15,
  floors: 6,
  floorHeight: 3.0,
  color: 0x4A90E2,
  name: 'My Custom Building',
  windowToWallRatio: 0.4
});
```

## Building Configuration Options

```typescript
interface SampleBuildingConfig {
  centerX?: number;          // X position (default: 0)
  centerZ?: number;          // Z position (default: 0) 
  radius?: number;           // Pentagon radius (default: 10)
  floors?: number;           // Number of floors (default: 5)
  floorHeight?: number;      // Height per floor (default: 3.5)
  color?: number;            // Building color hex (default: theme)
  name?: string;             // Building name
  description?: string;      // Building description
  windowToWallRatio?: number; // Window coverage 0-1 (default: 0.4)
}
```

## Integration with Existing App

To enable console helpers, add this to your main app initialization:

```typescript
import { initializeSampleBuildingHelpers } from '../utils/sampleBuildingHelpers';

// After your services are initialized
initializeSampleBuildingHelpers(
  buildingService,
  windowService,
  addBuildingToManager // Optional: function to add building to manager
);
```

## Pentagon Shape

The pentagon is created with 5 equally spaced points around a circle:
- Points are distributed every 72 degrees (360° ÷ 5)
- First point is at the top (-90° from horizontal)
- Shape is oriented with a flat bottom edge
- All coordinates are rounded to 2 decimal places for clean geometry

## Features

- ✅ Creates perfect pentagon-shaped buildings
- ✅ Configurable size, height, and position
- ✅ Automatic window placement using existing window system
- ✅ Proper shadow casting and receiving
- ✅ Integration with building management system
- ✅ Browser console access for quick testing
- ✅ React hooks for component integration
- ✅ UI toolbar with preset building types
- ✅ Multiple building grid creation
- ✅ Proper geometry calculation and area computation

## Troubleshooting

1. **Building not visible**: Check camera position and ensure building is within view
2. **No windows**: Ensure WindowService is passed and properly initialized
3. **Console functions not available**: Make sure `initializeSampleBuildingHelpers()` was called
4. **Building not interactive**: Ensure building manager's `addBuilding` function is called

## Examples

```javascript
// Create a small residential pentagon
addSampleBuilding(buildingService, windowService, {
  centerX: 0,
  centerZ: 0,
  radius: 8,
  floors: 2,
  floorHeight: 2.8,
  color: 0x8B4513,
  name: 'Small House'
});

// Create a large office complex
addSampleBuilding(buildingService, windowService, {
  centerX: 50,
  centerZ: 50,
  radius: 20,
  floors: 12,
  floorHeight: 3.5,
  color: 0x4682B4,
  name: 'Office Tower',
  windowToWallRatio: 0.6
});
```
