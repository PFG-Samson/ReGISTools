import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    L: any;
  }
}

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // Dynamically load Leaflet CSS and JS
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else if (window.L && mapRef.current && !mapInstance.current) {
      initializeMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstance.current) return;

    const L = window.L;
    
    // Initialize map
    mapInstance.current = L.map(mapRef.current, {
      center: [40.7589, -73.9851], // NYC coordinates as example
      zoom: 12,
      zoomControl: false
    });

    // Add zoom control to top right
    L.control.zoom({
      position: 'topright'
    }).addTo(mapInstance.current);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance.current);

    // Asset icon
    const assetIcon = L.divIcon({
      className: 'asset-marker',
      html: '<div style="background: hsl(211, 84%, 42%); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Staff icon
    const staffIcon = L.divIcon({
      className: 'staff-marker',
      html: '<div style="background: #16a34a; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Sample asset locations (in a real app, these would come from API)
    const sampleAssets = [
      { lat: 40.7614, lng: -73.9776, name: 'Generator Unit', id: 'GEN-4792', type: 'Equipment' },
      { lat: 40.7505, lng: -73.9934, name: 'Fleet Vehicle', id: 'VHC-2341', type: 'Vehicle' },
      { lat: 40.7589, lng: -73.9851, name: 'Server Rack', id: 'ITQ-8901', type: 'IT Equipment' }
    ];

    sampleAssets.forEach(asset => {
      L.marker([asset.lat, asset.lng], { icon: assetIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="padding: 8px; font-family: Inter, system-ui, sans-serif;">
            <h4 style="font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${asset.name}</h4>
            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 14px;">${asset.id}</p>
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">${asset.type}</p>
            <div style="display: flex; gap: 8px;">
              <button style="padding: 4px 8px; background: hsl(211, 84%, 42%); color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">View Details</button>
              <button style="padding: 4px 8px; background: #6b7280; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Edit</button>
            </div>
          </div>
        `);
    });

    // Sample staff locations
    const sampleStaff = [
      { lat: 40.7580, lng: -73.9855, name: 'Mike Rodriguez', role: 'Field Technician' },
      { lat: 40.7620, lng: -73.9790, name: 'Emma Chen', role: 'GIS Analyst' }
    ];

    sampleStaff.forEach(staff => {
      L.marker([staff.lat, staff.lng], { icon: staffIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="padding: 8px; font-family: Inter, system-ui, sans-serif;">
            <h4 style="font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${staff.name}</h4>
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">${staff.role}</p>
            <button style="padding: 4px 8px; background: #16a34a; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">View Profile</button>
          </div>
        `);
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Asset Map</h3>
            <div className="flex items-center space-x-2">
              <Button size="sm" data-testid="button-toggle-layers">
                <i className="fas fa-layer-group mr-1"></i>
                Layers
              </Button>
              <Button variant="secondary" size="sm" data-testid="button-fullscreen">
                <i className="fas fa-expand mr-1"></i>
                Fullscreen
              </Button>
            </div>
          </div>
        </div>
        <div className="relative">
          <div 
            ref={mapRef} 
            className="h-96 w-full"
            data-testid="map-container"
          ></div>
          
          {/* Layer Controls */}
          <div className="absolute top-4 left-4 bg-card rounded-lg border border-border shadow-lg p-3 z-[1000]">
            <h4 className="text-sm font-medium text-foreground mb-2">Map Layers</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-input text-primary focus:ring-ring"
                  data-testid="checkbox-assets-layer"
                />
                <span className="text-foreground">Assets</span>
                <span className="text-xs text-muted-foreground">(3)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-input text-primary focus:ring-ring"
                  data-testid="checkbox-staff-layer"
                />
                <span className="text-foreground">Staff Locations</span>
                <span className="text-xs text-muted-foreground">(2)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  className="rounded border-input text-primary focus:ring-ring"
                  data-testid="checkbox-boundaries-layer"
                />
                <span className="text-foreground">Boundaries</span>
              </label>
            </div>
          </div>

          {/* Map Search */}
          <div className="absolute top-4 right-4 bg-card rounded-lg border border-border shadow-lg p-2 z-[1000]">
            <div className="flex items-center space-x-2">
              <Input 
                type="text" 
                placeholder="Search on map..." 
                className="w-48 h-8 text-sm"
                data-testid="input-map-search"
              />
              <Button size="sm" variant="ghost" data-testid="button-map-search">
                <i className="fas fa-search text-sm"></i>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
