export interface Category {
  id: string;
  name: string;
  iconName: string;
  itemCount: number;
  featured: boolean;
  color: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: "cat_1",
    name: "Pipes & Fittings",
    iconName: "piping",
    itemCount: 142,
    featured: true,
    color: "#e8f0fe",
    description: "CPVC, UPVC, PVC pipes and high-durability elbow fittings"
  },
  {
    id: "cat_2",
    name: "Faucets & Taps",
    iconName: "faucet",
    itemCount: 98,
    featured: true,
    color: "#feefc3",
    description: "Chrome basin mixers, pillar taps, sink spouts & angle valves"
  },
  {
    id: "cat_3",
    name: "Sanitaryware",
    iconName: "bath",
    itemCount: 76,
    featured: true,
    color: "#e6f4ea",
    description: "Water closets, washbasins, cisterns & shower panels"
  },
  {
    id: "cat_4",
    name: "Valves & Controls",
    iconName: "valve",
    itemCount: 54,
    featured: true,
    color: "#fce8e6",
    description: "Brass ball valves, gate valves, check valves & pressure regulators"
  },
  {
    id: "cat_5",
    name: "Water Tanks & Pumps",
    iconName: "tank",
    itemCount: 32,
    featured: false,
    color: "#f3e8fd",
    description: "Submersible pumps, pressure booster pumps & 1000L tanks"
  },
  {
    id: "cat_6",
    name: "Drainage & Sewage",
    iconName: "drain",
    itemCount: 45,
    featured: false,
    color: "#eef3f8",
    description: "Floor traps, gully traps, drain pipes & cleanout plugs"
  },
  {
    id: "cat_7",
    name: "Water Heaters & Geysers",
    iconName: "flame",
    itemCount: 29,
    featured: true,
    color: "#fff0e6",
    description: "Instant 3L geysers, 25L storage geysers & solar water heaters"
  },
  {
    id: "cat_8",
    name: "Tools & Sealants",
    iconName: "wrench",
    itemCount: 68,
    featured: false,
    color: "#eef2ff",
    description: "Teflon tape, solvent cement, pipe wrenches & silicone sealant"
  }
];
