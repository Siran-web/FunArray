'use client';

import React from 'react';
import { FurnitureControls, FurnitureControlsProps } from './FurnitureControls';

export const TransformControls: React.FC<FurnitureControlsProps> = (props) => {
  return <FurnitureControls {...props} />;
};

export default TransformControls;
