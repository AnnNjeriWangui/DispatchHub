/**
 * Reflex Logistics - Localized Kenyan EV Fleet Data
 * Electric motorbike fleets: Roam Air, Spiro Commuter, Ampersand e-Boda
 */

export const MOCK_RIDERS = [
  {
    id: "RIDER-001",
    name: "Hesbon Otieno",
    gender: "Male",
    phone: "+254 712 345 678",
    formattedPhone: "0712345678",
    email: "hesbon.otieno@reflex.co.ke",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80",
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
    phone: "+254 722 987 654",
    formattedPhone: "0722987654",
    email: "faith.wambui@reflex.co.ke",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=250&auto=format&fit=crop&q=80",
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
    phone: "+254 733 456 789",
    formattedPhone: "0733456789",
    email: "aminah.hassan@reflex.co.ke",
    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=250&auto=format&fit=crop&q=80",
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
    phone: "+254 701 234 567",
    formattedPhone: "0701234567",
    email: "brian.kipkorir@reflex.co.ke",
    avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=250&auto=format&fit=crop&q=80",
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
  }
];

export const getRiderById = (id) => MOCK_RIDERS.find(r => r.id === id) || MOCK_RIDERS[0];
export const getDefaultRider = () => MOCK_RIDERS[0];
