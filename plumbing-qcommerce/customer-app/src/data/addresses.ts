export interface Address {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  phone: string;
  flat: string;
  area: string;
  landmark: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export const initialAddresses: Address[] = [
  {
    id: "addr_1",
    type: "home",
    name: "Akhil Sharma",
    phone: "+91 98765 11223",
    flat: "Flat 402, Sunshine Residency, Tower B",
    area: "Sector 14, 27th Main, HSR Layout",
    landmark: "Near BDA Complex",
    city: "Bengaluru",
    pincode: "560102",
    isDefault: true
  },
  {
    id: "addr_2",
    type: "work",
    name: "Akhil Sharma",
    phone: "+91 98765 11223",
    flat: "TechPark One, 3rd Floor, Wing A",
    area: "Outer Ring Road, Bellandur",
    landmark: "Opposite EcoSpace",
    city: "Bengaluru",
    pincode: "560103",
    isDefault: false
  }
];
