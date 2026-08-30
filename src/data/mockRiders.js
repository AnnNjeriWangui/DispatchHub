/**
 * Reflex Logistics - Localized Kenyan EV Fleet Data
 * Electric motorbike fleets: Roam Air, Spiro Commuter, Ampersand e-Boda
 * Authentic Kenyan Black male and female rider profile portraits
 */

export const MOCK_RIDERS = [
  {
    id: "RIDER-001",
    name: "Hesbon Otieno",
    gender: "Male",
    tribe: "Luo",
    age: 26,
    phone: "+254 712 345 678",
    formattedPhone: "0712345678",
    email: "hesbon.otieno@reflex.co.ke",
    avatar: "/assets/riders/hesbon_otieno.jpg",
    avatarFallback: "HO",
    rating: 4.9,
    completedDeliveries: 412,
    hub: "Westlands EV Charging Hub",
    zone: "Nairobi North",
    dutyStatus: "ONLINE", // ONLINE, CHARGING, OFF_DUTY
    vehicle: {
      model: "Roam Air",
      type: "Electric Motorbike",
      plateNumber: "KME 102G",
      batteryLevel: 88,
      estimatedRangeKm: 78,
      batteryHealth: "Good (96%)",
      swapStationNearby: "Sarit Centre Battery Hub (0.4 km)"
    }
  },
  {
    id: "RIDER-002",
    name: "Faith Wambui",
    gender: "Female",
    tribe: "Kikuyu",
    age: 24,
    phone: "+254 722 987 654",
    formattedPhone: "0722987654",
    email: "faith.wambui@reflex.co.ke",
    avatar: "/assets/riders/faith_wambui.jpg",
    avatarFallback: "FW",
    rating: 4.95,
    completedDeliveries: 538,
    hub: "Kilimani Express Station",
    zone: "Nairobi Central",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Spiro Commuter",
      type: "Electric Motorbike",
      plateNumber: "KME 340G",
      batteryLevel: 74,
      estimatedRangeKm: 62,
      batteryHealth: "Excellent (98%)",
      swapStationNearby: "Yaya Centre Spiro Station (0.8 km)"
    }
  },
  {
    id: "RIDER-003",
    name: "Aminah Hassan",
    gender: "Female",
    tribe: "Swahili",
    age: 22,
    phone: "+254 733 456 789",
    formattedPhone: "0733456789",
    email: "aminah.hassan@reflex.co.ke",
    avatar: "/assets/riders/aminah_hassan.jpg",
    avatarFallback: "AH",
    rating: 4.88,
    completedDeliveries: 389,
    hub: "Nairobi CBD Logistics Hub",
    zone: "Nairobi East",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Ampersand e-Boda",
      type: "Electric Motorbike",
      plateNumber: "KME 512G",
      batteryLevel: 92,
      estimatedRangeKm: 85,
      batteryHealth: "Excellent (99%)",
      swapStationNearby: "City Hall Ampersand Pod (0.2 km)"
    }
  },
  {
    id: "RIDER-004",
    name: "Brian Kipkorir",
    gender: "Male",
    tribe: "Kalenjin",
    age: 28,
    phone: "+254 701 234 567",
    formattedPhone: "0701234567",
    email: "brian.kipkorir@reflex.co.ke",
    avatar: "/assets/riders/brian_kipkorir.jpg",
    avatarFallback: "BK",
    rating: 4.78,
    completedDeliveries: 295,
    hub: "Industrial Area Depot",
    zone: "Nairobi South",
    dutyStatus: "CHARGING",
    vehicle: {
      model: "Roam Air",
      type: "Electric Motorbike",
      plateNumber: "KME 889G",
      batteryLevel: 65,
      estimatedRangeKm: 55,
      batteryHealth: "Good (94%)",
      swapStationNearby: "Enterprise Rd Charging Hub (0.1 km)"
    }
  },
  {
    id: "DISP-001",
    name: "Jackson Kiprotich",
    gender: "Male",
    tribe: "Kalenjin",
    age: 29,
    phone: "+254 701 112 233",
    formattedPhone: "0701112233",
    email: "jackson.kiprotich@reflex.co.ke",
    avatar: "/assets/riders/jackson_kiprotich.jpg",
    avatarFallback: "JK",
    rating: 4.9,
    completedDeliveries: 480,
    hub: "Westlands Boda Hub",
    zone: "Westlands / Parklands",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Box-Equipped Boda",
      type: "Boda Boda Motorcycle",
      plateNumber: "KMD 492T",
      batteryLevel: 95,
      estimatedRangeKm: 90,
      batteryHealth: "Good (95%)",
      swapStationNearby: "Parklands Fuel & Boda Station"
    }
  },
  {
    id: "DISP-002",
    name: "Samuel Odhiambo",
    gender: "Male",
    tribe: "Luo",
    age: 32,
    phone: "+254 702 334 455",
    formattedPhone: "0702334455",
    email: "samuel.odhiambo@reflex.co.ke",
    avatar: "/assets/riders/samuel_odhiambo.jpg",
    avatarFallback: "SO",
    rating: 4.8,
    completedDeliveries: 310,
    hub: "Lavington Depot",
    zone: "Lavington / Kileleshwa",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Refrigerated Courier Van",
      type: "Delivery Van",
      plateNumber: "KDG 810Z",
      batteryLevel: 82,
      estimatedRangeKm: 120,
      batteryHealth: "Excellent (97%)",
      swapStationNearby: "Lavington Green Logistics Base"
    }
  },
  {
    id: "DISP-003",
    name: "Peter Kamau",
    gender: "Male",
    tribe: "Kikuyu",
    age: 28,
    phone: "+254 703 556 677",
    formattedPhone: "0703556677",
    email: "peter.kamau@reflex.co.ke",
    avatar: "/assets/riders/peter_kamau.jpg",
    avatarFallback: "PK",
    rating: 4.95,
    completedDeliveries: 620,
    hub: "CBD Cargo Hub",
    zone: "Nairobi CBD / Upper Hill",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Cargo TukTuk Express",
      type: "Cargo TukTuk",
      plateNumber: "KTK 123X",
      batteryLevel: 90,
      estimatedRangeKm: 80,
      batteryHealth: "Good (92%)",
      swapStationNearby: "Haile Selassie Station"
    }
  },
  {
    id: "DISP-004",
    name: "Grace Nduta",
    gender: "Female",
    tribe: "Kikuyu",
    age: 25,
    phone: "+254 704 778 899",
    formattedPhone: "0704778899",
    email: "grace.nduta@reflex.co.ke",
    avatar: "/assets/riders/grace_nduta.jpg",
    avatarFallback: "GN",
    rating: 4.85,
    completedDeliveries: 350,
    hub: "Karen Eco Depot",
    zone: "Karen / Langata",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Electric Eco-Bike (Insulated Bag)",
      type: "Electric Eco-Bike",
      plateNumber: "KEB 904A",
      batteryLevel: 86,
      estimatedRangeKm: 70,
      batteryHealth: "Excellent (98%)",
      swapStationNearby: "The Hub Karen Charging Node"
    }
  },
  {
    id: "DISP-005",
    name: "Boniface Maina",
    gender: "Male",
    tribe: "Meru",
    age: 33,
    phone: "+254 705 990 011",
    formattedPhone: "0705990011",
    email: "boniface.maina@reflex.co.ke",
    avatar: "/assets/riders/boniface_maina.jpg",
    avatarFallback: "BM",
    rating: 4.9,
    completedDeliveries: 515,
    hub: "Thika Road Logistics Hub",
    zone: "Thika Road / Kiambu / Ruaka",
    dutyStatus: "ONLINE",
    vehicle: {
      model: "Courier Van (High-Security)",
      type: "Courier Van",
      plateNumber: "KCJ 554B",
      batteryLevel: 78,
      estimatedRangeKm: 140,
      batteryHealth: "Good (93%)",
      swapStationNearby: "Garden City Logistics Depot"
    }
  }
];

export const getRiderById = (id) => MOCK_RIDERS.find(r => r.id === id) || MOCK_RIDERS[0];
export const getDefaultRider = () => MOCK_RIDERS[0];
