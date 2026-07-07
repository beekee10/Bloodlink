import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapView = ({ latitude, longitude, markers = [], radius, centerLabel = "Your Location" }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circleLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const parsedLat = parseFloat(latitude) || 28.6139;
    const parsedLon = parseFloat(longitude) || 77.2090;

    // Initialize leaflet map instance
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([parsedLat, parsedLon], 12);
      
      // Load OpenStreetMap tiles (premium dark themed styles or standard)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.setView([parsedLat, parsedLon], mapInstanceRef.current.getZoom());
    }

    // Clear previous markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // Reset radius circle
    if (circleLayerRef.current) {
      circleLayerRef.current.remove();
      circleLayerRef.current = null;
    }

    // Draw active radius (if radius provided in km)
    if (radius) {
      circleLayerRef.current = L.circle([parsedLat, parsedLon], {
        color: '#d91a2a',
        fillColor: '#d91a2a',
        fillOpacity: 0.1,
        radius: radius * 1000 // Km to meters
      }).addTo(mapInstanceRef.current);
    }

    // Create a special center icon (Blue location pin)
    const centerPin = L.divIcon({
      className: 'center-pin-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute h-8 w-8 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="h-5 w-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-[9px] font-bold text-white">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Add primary user position marker
    L.marker([parsedLat, parsedLon], { icon: centerPin })
      .addTo(markersLayerRef.current)
      .bindPopup(`<b>${centerLabel}</b><br>Lat: ${parsedLat.toFixed(4)}, Lon: ${parsedLon.toFixed(4)}`)
      .openPopup();

    // Map matched donor/hospital list as Red pins
    markers.forEach(m => {
      if (!m.latitude || !m.longitude) return;

      const markerPin = L.divIcon({
        className: 'marker-pin-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute h-8 w-8 rounded-full bg-bloodred-500/20 animate-pulse"></div>
            <div class="h-6 w-6 rounded-full bg-bloodred-500 border-2 border-white flex items-center justify-center shadow-md text-[9px] font-bold text-white">${m.bloodGroup || '🩸'}</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const cardHtml = `
        <div class="p-1 font-sans text-xs text-slate-800">
          <h4 class="font-bold text-bloodred-600">${m.name}</h4>
          <p class="m-0 text-[10px]">Distance: <b>${m.distance || '?'} km</b></p>
          ${m.phone ? `<p class="m-0 text-[10px]">Phone: ${m.phone}</p>` : ''}
          ${m.suitabilityScore ? `<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Suitability: ${m.suitabilityScore}%</span>` : ''}
        </div>
      `;

      L.marker([m.latitude, m.longitude], { icon: markerPin })
        .addTo(markersLayerRef.current)
        .bindPopup(cardHtml);
    });

  }, [latitude, longitude, markers, radius, centerLabel]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-[380px]" />
    </div>
  );
};

export default MapView;
