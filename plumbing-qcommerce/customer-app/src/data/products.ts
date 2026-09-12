export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  brand: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  unit: string;
  description: string;
  specs: Record<string, string>;
  imageUrl: string;
  badge?: string;
}

export const products: Product[] = [
  {
    id: "prod_1",
    name: "CPVC High-Pressure Pipe SDR 11 (1 Inch x 3 Meter)",
    category: "Pipes & Fittings",
    price: 420,
    originalPrice: 490,
    brand: "Astral Pipes",
    rating: 4.9,
    reviewsCount: 312,
    inStock: true,
    unit: "3m Length",
    badge: "Top Seller",
    description: "Lead-free CPVC pipe suitable for hot and cold potable water plumbing up to 93°C.",
    specs: {
      "Material": "Chlorinated Polyvinyl Chloride (CPVC)",
      "Size": "1 Inch (25mm)",
      "Class": "SDR 11 (Class 1)",
      "Max Temp": "93°C",
      "Standard": "ASTM D2846"
    },
    imageUrl: "https://images.unsplash.com/photo-1542013936693-884638332954?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_2",
    name: "Heavy-Duty Brass Quarter Turn Ball Valve (3/4 Inch)",
    category: "Valves & Controls",
    price: 340,
    originalPrice: 410,
    brand: "Zoloto",
    rating: 4.8,
    reviewsCount: 184,
    inStock: true,
    unit: "Piece",
    badge: "10-Yr Warranty",
    description: "Forged brass body with chrome-plated brass ball and Teflon PTFE seat rings.",
    specs: {
      "Body Material": "Forged Brass IS 6912",
      "Nominal Size": "20mm (3/4 Inch)",
      "Pressure Rating": "PN 25",
      "Handle Type": "Insulated Steel Lever"
    },
    imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_3",
    name: "Modern Chrome Single-Lever Basin Mixer Tap",
    category: "Faucets & Taps",
    price: 1899,
    originalPrice: 2499,
    brand: "Jaquar",
    rating: 4.9,
    reviewsCount: 420,
    inStock: true,
    unit: "Unit",
    badge: "Premium Design",
    description: "Architectural tall boy basin mixer with ceramic cartridge and aerated foam flow.",
    specs: {
      "Finish": "Chrome Plated Mirror Polish",
      "Cartridge": "35mm Ceramic Disc",
      "Aerator": "Neoperl Water Saver (30% savings)",
      "Warranty": "10 Years On-Site"
    },
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_4",
    name: "Multi-Function Over-Head Rain Shower (8x8 Inch)",
    category: "Sanitaryware",
    price: 1199,
    originalPrice: 1650,
    brand: "Kohler",
    rating: 4.7,
    reviewsCount: 215,
    inStock: true,
    unit: "Set with 12-inch Arm",
    badge: "Best Value",
    description: "Ultra-slim 304 stainless steel square rain shower with anti-clog silicone nozzles.",
    specs: {
      "Size": "200mm x 200mm (8x8 Inch)",
      "Material": "SS 304 Stainless Steel",
      "Nozzles": "Rub-clean soft silicone",
      "Connection": "Standard 1/2 Inch BSP"
    },
    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_5",
    name: "Heavy Duty Teflon PTFE Thread Seal Tape (12mm x 12m)",
    category: "Tools & Sealants",
    price: 35,
    originalPrice: 50,
    brand: "FixKart Pro",
    rating: 4.9,
    reviewsCount: 1540,
    inStock: true,
    unit: "Roll",
    badge: "Plumber Choice",
    description: "High-density thread seal tape preventing leakage in threaded pipe joints.",
    specs: {
      "Width": "12mm",
      "Length": "12 Meters",
      "Thickness": "0.1mm High Density",
      "Temperature Range": "-190°C to +260°C"
    },
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_6",
    name: "Instant 3 Litre Water Heater / Geyser (3000W)",
    category: "Water Heaters & Geysers",
    price: 2899,
    originalPrice: 3800,
    brand: "Bajaj",
    rating: 4.8,
    reviewsCount: 680,
    inStock: true,
    unit: "Unit",
    badge: "Fast Heating",
    description: "High-grade SS 304 inner tank with rust-proof thermoplastic external body and 6.5 bar rating.",
    specs: {
      "Capacity": "3 Litres",
      "Wattage": "3000 Watts Copper Heating Element",
      "Pressure Rating": "6.5 Bar (High-rise compatible)",
      "Safety": "Dual thermal cut-off & PRV"
    },
    imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&auto=format&fit=crop&q=80"
  }
];
