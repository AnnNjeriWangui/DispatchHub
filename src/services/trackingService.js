/**
 * Reflex Tracking Service - Live GPS Telemetry, Geolocation Emitter & Simulated Route Stream
 * Covers Nairobi Westlands, Kilimani, Lavington & CBD Delivery Routes
 */

// Simulated Nairobi Route Waypoints (Sarit Centre -> Rhapta Rd -> Yaya Centre -> City Centre)
const NAIROBI_ROUTE_WAYPOINTS = [
  { lat: -1.2618, lng: 36.8049, name: "Sarit Centre, Westlands", speed: 28 },
  { lat: -1.2642, lng: 36.8005, name: "Waiyaki Way Interchange", speed: 42 },
  { lat: -1.2691, lng: 36.7932, name: "Rhapta Road Roundabout", speed: 35 },
  { lat: -1.2783, lng: 36.7884, name: "Riverside Drive Crossing", speed: 30 },
  { lat: -1.2885, lng: 36.7841, name: "Lavington Green Shopping Mall", speed: 25 },
  { lat: -1.2915, lng: 36.7918, name: "Adlife Plaza, Chania Ave (Kilimani)", speed: 32 },
  { lat: -1.2942, lng: 36.7981, name: "Yaya Centre, Argwings Kodhek Rd", speed: 38 },
  { lat: -1.2864, lng: 36.8172, name: "Valley Road Flyover", speed: 45 },
  { lat: -1.2831, lng: 36.8228, name: "Nairobi City Hall / CBD Hub", speed: 20 }
];

class TrackingService {
  constructor() {
    this.watchId = null;
    this.subscribers = new Set();
    this.isTracking = false;
    this.isSimulation = false;
    this.simIndex = 0;
    this.simTimer = null;

    this.currentPosition = {
      latitude: NAIROBI_ROUTE_WAYPOINTS[0].lat,
      longitude: NAIROBI_ROUTE_WAYPOINTS[0].lng,
      heading: 145,
      speed: 30, // km/h
      accuracy: 4.2, // meters
      locationName: NAIROBI_ROUTE_WAYPOINTS[0].name,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Subscribe callback to receive live telemetry updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    // Send immediate current position
    callback(this.currentPosition);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb({ ...this.currentPosition }));
  }

  /**
   * Start live browser Geolocation watchPosition
   */
  startLiveTracking(options = {}) {
    if (this.isSimulation) this.stopSimulation();
    if (this.isTracking) return;

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      this.isTracking = true;
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 180,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 25,
            accuracy: Math.round(position.coords.accuracy * 10) / 10,
            locationName: "GPS Live Position",
            timestamp: new Date(position.timestamp).toISOString()
          };
          this.notifySubscribers();
        },
        (error) => {
          console.warn("Browser GPS watchPosition error, switching to Nairobi Route Simulator:", error.message);
          this.startSimulation();
        },
        geoOptions
      );
    } else {
      console.warn("Geolocation API not supported. Falling back to route simulation.");
      this.startSimulation();
    }
  }

  /**
   * Stop tracking
   */
  stopTracking() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.stopSimulation();
    this.isTracking = false;
  }

  /**
   * Start continuous Nairobi Route Simulator
   */
  startSimulation(intervalMs = 3500) {
    if (this.isSimulation) return;
    this.isSimulation = true;
    this.isTracking = true;

    this.simTimer = setInterval(() => {
      this.simIndex = (this.simIndex + 1) % NAIROBI_ROUTE_WAYPOINTS.length;
      const wp = NAIROBI_ROUTE_WAYPOINTS[this.simIndex];
      const prevWp = NAIROBI_ROUTE_WAYPOINTS[(this.simIndex - 1 + NAIROBI_ROUTE_WAYPOINTS.length) % NAIROBI_ROUTE_WAYPOINTS.length];
      
      // Calculate heading direction
      const headingDeg = Math.round((Math.atan2(wp.lng - prevWp.lng, wp.lat - prevWp.lat) * 180) / Math.PI);
      const normalizedHeading = (headingDeg + 360) % 360;

      this.currentPosition = {
        latitude: wp.lat + (Math.random() - 0.5) * 0.0004, // slight realistic jitter
        longitude: wp.lng + (Math.random() - 0.5) * 0.0004,
        heading: normalizedHeading,
        speed: wp.speed + Math.floor(Math.random() * 5),
        accuracy: 3.5 + Math.round(Math.random() * 2),
        locationName: wp.name,
        timestamp: new Date().toISOString()
      };

      this.notifySubscribers();
    }, intervalMs);
  }

  stopSimulation() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    this.isSimulation = false;
  }

  toggleSimulationMode() {
    if (this.isSimulation) {
      this.stopSimulation();
      this.startLiveTracking();
    } else {
      this.startSimulation();
    }
    return this.isSimulation;
  }

  // Calculate Haversine distance between two coordinates in kilometers
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

export const trackingService = new TrackingService();
export default trackingService;
