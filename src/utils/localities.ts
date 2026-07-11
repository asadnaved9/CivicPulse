export interface Locality {
  name: string;
  lat: number;
  lng: number;
  city: string;
}

export const LOCALITIES: Locality[] = [
  // Kolkata
  { name: "Park Street", lat: 22.5539, lng: 88.3531, city: "Kolkata" },
  { name: "Salt Lake Sector V", lat: 22.5735, lng: 88.4331, city: "Kolkata" },
  { name: "Gariahat", lat: 22.5190, lng: 88.3653, city: "Kolkata" },
  { name: "New Town", lat: 22.5804, lng: 88.4813, city: "Kolkata" },
  { name: "Howrah", lat: 22.5850, lng: 88.3184, city: "Kolkata" },
  // Bangalore
  { name: "Koramangala 4th Block", lat: 12.9348, lng: 77.6256, city: "Bangalore" },
  { name: "Indiranagar 100 Feet Rd", lat: 12.9718, lng: 77.6412, city: "Bangalore" },
  { name: "Whitefield Main Rd", lat: 12.9698, lng: 77.7499, city: "Bangalore" },
  { name: "HSR Layout Sector 2", lat: 12.9105, lng: 77.6450, city: "Bangalore" },
  { name: "Jayanagar 4th Block", lat: 12.9279, lng: 77.5909, city: "Bangalore" }
];
