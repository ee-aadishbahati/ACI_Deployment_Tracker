import { Fabric } from '../types';

export const fabricsData: Fabric[] = [
  {
    id: 'north-it',
    name: 'North IT Fabric',
    site: 'North',
    type: 'IT',
    description: 'IT infrastructure fabric at North data center'
  },
  {
    id: 'north-ot',
    name: 'North OT Fabric', 
    site: 'North',
    type: 'OT',
    description: 'Operational Technology fabric at North data center'
  },
  {
    id: 'south-it',
    name: 'South IT Fabric',
    site: 'South', 
    type: 'IT',
    description: 'IT infrastructure fabric at South data center'
  },
  {
    id: 'south-ot',
    name: 'South OT Fabric',
    site: 'South',
    type: 'OT', 
    description: 'Operational Technology fabric at South data center'
  },
  {
    id: 'tertiary-it',
    name: 'Tertiary IT Fabric',
    site: 'Tertiary',
    type: 'IT',
    description: 'IT infrastructure fabric at Tertiary data center (NDO host)'
  },
  {
    id: 'tertiary-ot',
    name: 'Tertiary OT Fabric',
    site: 'Tertiary',
    type: 'OT',
    description: 'Operational Technology fabric at Tertiary data center (NDO managed)'
  }
];
