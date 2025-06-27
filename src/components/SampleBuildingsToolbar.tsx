import React from 'react';
import { Building2, Grid3x3, Home, Briefcase } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { useSampleBuildings } from '../hooks/useSampleBuildings';

interface SampleBuildingsToolbarProps {
  buildingService: any; // BuildingService type
  windowService: any; // WindowService type
  addBuilding?: (building: any) => void; // Function to add building to manager
  disabled?: boolean;
}

export const SampleBuildingsToolbar: React.FC<SampleBuildingsToolbarProps> = ({
  buildingService,
  windowService,
  addBuilding,
  disabled = false
}) => {
  const {
    createSamplePentagon,
    createSampleOfficeBuilding,
    createSampleResidentialBuilding,
    createMultipleSampleBuildings
  } = useSampleBuildings({ buildingService, windowService, addBuilding });

  const handleAddPentagon = () => {
    const building = createSamplePentagon();
    if (building) {
      console.log('Added sample pentagon building:', building.id);
    }
  };

  const handleAddOfficeBuilding = () => {
    const building = createSampleOfficeBuilding(20, 0);
    if (building) {
      console.log('Added sample office building:', building.id);
    }
  };

  const handleAddResidentialBuilding = () => {
    const building = createSampleResidentialBuilding(-20, 0);
    if (building) {
      console.log('Added sample residential building:', building.id);
    }
  };

  const handleAddMultipleBuildings = () => {
    const buildings = createMultipleSampleBuildings(5, 35);
    console.log(`Added ${buildings.length} sample buildings`);
  };

  return (
    <div className="flex flex-col gap-1 p-2 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-600">
      <div className="text-xs text-gray-400 px-2 py-1 font-medium">Sample Buildings</div>
      
      <ToolbarButton
        icon={Building2}
        tooltip="Add Sample Pentagon Building"
        onClick={handleAddPentagon}
        disabled={disabled}
        variant="success"
      />
      
      <ToolbarButton
        icon={Briefcase}
        tooltip="Add Sample Office Building"
        onClick={handleAddOfficeBuilding}
        disabled={disabled}
        variant="primary"
      />
      
      <ToolbarButton
        icon={Home}
        tooltip="Add Sample Residential Building"
        onClick={handleAddResidentialBuilding}
        disabled={disabled}
        variant="default"
      />
      
      <ToolbarButton
        icon={Grid3x3}
        tooltip="Add Multiple Sample Buildings"
        onClick={handleAddMultipleBuildings}
        disabled={disabled}
        variant="danger"
      />
    </div>
  );
};
