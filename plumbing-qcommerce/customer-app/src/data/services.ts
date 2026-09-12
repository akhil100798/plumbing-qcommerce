export interface PlumbingService {
  id: string;
  title: string;
  category: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  durationMinutes: number;
  badge?: string;
  description: string;
  includedTasks: string[];
  excludedTasks: string[];
  imageUrl: string;
}

export const services: PlumbingService[] = [
  {
    id: "srv_1",
    title: "Tap & Faucet Repair / Replacement",
    category: "Faucets & Taps",
    rating: 4.8,
    reviewsCount: 1420,
    price: 199,
    originalPrice: 299,
    durationMinutes: 30,
    badge: "Bestseller",
    description: "Fix dripping taps, replace washer/spindle, or install new wall-mounted basin taps.",
    includedTasks: [
      "Inspection of valve spindle & rubber washer",
      "Removal of old tap and rust cleaning",
      "Installation with Teflon sealant tape",
      "Water pressure testing & leak check"
    ],
    excludedTasks: [
      "Cost of new tap or spare parts",
      "Major piping modification behind tile"
    ],
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "srv_2",
    title: "Pipe Leakage Detection & Repair",
    category: "Pipes & Fittings",
    rating: 4.9,
    reviewsCount: 890,
    price: 349,
    originalPrice: 499,
    durationMinutes: 45,
    badge: "Emergency Service",
    description: "Locate hidden water seepage, repair burst CPVC pipes or join leaking fittings.",
    includedTasks: [
      "Thermal leakage & pressure test",
      "Cutting and replacing damaged pipe section",
      "Solvent welding and clamping",
      "60-day leak warranty on repair"
    ],
    excludedTasks: [
      "Tile replacement or wall plastering",
      "Painting damaged plaster"
    ],
    imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "srv_3",
    title: "Flush Tank & Western Toilet Repair",
    category: "Sanitaryware",
    rating: 4.7,
    reviewsCount: 650,
    price: 299,
    originalPrice: 399,
    durationMinutes: 40,
    badge: "Popular",
    description: "Fix continuous flushing water, replace siphon kit, inlet valve, or flush push button.",
    includedTasks: [
      "Cistern valve inspection & flushing mechanism adjustment",
      "Replacing flush lever or dual-flush push button",
      "Fixing flush bowl gasket leak"
    ],
    excludedTasks: [
      "Complete toilet commode replacement"
    ],
    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "srv_4",
    title: "Overhead Water Tank Cleaning",
    category: "Water Tanks & Pumps",
    rating: 4.9,
    reviewsCount: 1280,
    price: 499,
    originalPrice: 799,
    durationMinutes: 90,
    badge: "FixKart Guarantee",
    description: "Deep 5-step hygienic tank cleaning up to 1000L with high-pressure washer & UV treatment.",
    includedTasks: [
      "Dewatering & sludge removal",
      "High pressure washing & scrubbing",
      "Anti-bacterial vacuuming",
      "UV light disinfection spray"
    ],
    excludedTasks: [
      "Plumbing pipe replacement"
    ],
    imageUrl: "https://images.unsplash.com/photo-1521207418485-99c705420785?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "srv_5",
    title: "Geyser / Water Heater Service & Uninstallation",
    category: "Water Heaters & Geysers",
    rating: 4.8,
    reviewsCount: 940,
    price: 399,
    originalPrice: 599,
    durationMinutes: 60,
    badge: "Safe Fix",
    description: "Thermostat safety check, heating element descaling & safe mounting or uninstallation.",
    includedTasks: [
      "Scale & sediment flush from inner tank",
      "Safety valve testing",
      "Wiring & thermostat calibration"
    ],
    excludedTasks: [
      "Electrical main box repair"
    ],
    imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "srv_6",
    title: "Sink & Drain Unclogging",
    category: "Drainage & Sewage",
    rating: 4.9,
    reviewsCount: 2100,
    price: 249,
    originalPrice: 349,
    durationMinutes: 30,
    badge: "Express 30 Mins",
    description: "Clear clogged kitchen sinks, bathroom floor traps & drain pipes using electric auger tool.",
    includedTasks: [
      "Heavy blockage clearing using motorized drain snake",
      "Debris & hair trap extraction",
      "Chemical pipe flush & odor treatment"
    ],
    excludedTasks: [
      "Main underground sewer line excavation"
    ],
    imageUrl: "https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=500&auto=format&fit=crop&q=80"
  }
];
