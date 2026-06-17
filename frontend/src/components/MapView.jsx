import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getDynamicHotels, getDynamicRestaurants } from '../utils/seededAccommodations';

const MapView = ({ tripData, mapFocus }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerLayers = useRef([]);
  const routePolyline = useRef(null);
  const clusterGroup = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map markers and route lines when tripData changes
  useEffect(() => {
    if (!mapInstance.current || !tripData) return;

    // 1. Clear previous assets
    markerLayers.current.forEach(m => mapInstance.current.removeLayer(m));
    markerLayers.current = [];
    if (routePolyline.current) {
      mapInstance.current.removeLayer(routePolyline.current);
      routePolyline.current = null;
    }
    if (clusterGroup.current) {
      mapInstance.current.removeLayer(clusterGroup.current);
      clusterGroup.current = null;
    }

    const { state_intelligence, attractions, hidden_gems, start_location, destination } = tripData;
    const startCity = start_location || document.getElementById('start-location')?.value || 'Delhi';
    const destCity = destination || state_intelligence?.name || 'Goa';

    const geocodeAndPlot = async () => {
      try {
        // Geocode start location using free Nominatim API
        const startRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startCity + ", India")}`);
        const startData = await startRes.json();
        const startCoords = startData.length > 0 ? [parseFloat(startData[0].lat), parseFloat(startData[0].lon)] : [28.6139, 77.2090]; // Delhi default

        // Geocode destination location
        const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destCity + ", India")}`);
        const destData = await destRes.json();
        const destCoords = destData.length > 0 ? [parseFloat(destData[0].lat), parseFloat(destData[0].lon)] : [15.2993, 74.1240]; // Goa default

        // Custom Div Icons for elegant pins
        const startIcon = L.divIcon({
          className: 'custom-start-icon',
          html: `<div style="background-color: #818cf8; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px #818cf8;"></div>`
        });
        const destIcon = L.divIcon({
          className: 'custom-dest-icon',
          html: `<div style="background-color: #ff6b6b; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px #ff6b6b;"></div>`
        });

        // Plot start and destination markers (always visible outside clusters)
        const startMarker = L.marker(startCoords, { icon: startIcon }).bindPopup(`<b>Start Point:</b> ${startCity}`);
        const destMarker = L.marker(destCoords, { icon: destIcon }).bindPopup(`<b>Destination Hub:</b> ${destCity}<br>${state_intelligence?.description || ''}`);

        startMarker.addTo(mapInstance.current);
        destMarker.addTo(mapInstance.current);
        markerLayers.current.push(startMarker, destMarker);

        // Plot current user location (if allowed)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userCoords = [position.coords.latitude, position.coords.longitude];
              const locationIcon = L.divIcon({
                className: 'custom-location-icon',
                html: `<div class="user-pulse-marker" style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px #3b82f6; position: relative;">
                         <span style="position: absolute; display: inline-flex; border-radius: 50%; width: 100%; height: 100%; background: #3b82f6; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                       </div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });
              const locMarker = L.marker(userCoords, { icon: locationIcon }).bindPopup("<b>Your Current Location</b>");
              locMarker.addTo(mapInstance.current);
              markerLayers.current.push(locMarker);
            },
            (err) => console.log("User geolocation declined or unavailable.")
          );
        }

        // Initialize Marker Cluster Group for secondary pins (hotels, food, attractions)
        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 45,
          iconCreateFunction: (c) => {
            const count = c.getChildCount();
            return L.divIcon({
              html: `<div style="background: rgba(129, 140, 248, 0.9); border: 2px solid #fff; border-radius: 50%; color: #fff; font-weight: bold; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(129, 140, 248, 0.5); font-family: 'Outfit', sans-serif; font-size: 11px;">${count}</div>`,
              className: 'custom-map-cluster',
              iconSize: [32, 32]
            });
          }
        });
        clusterGroup.current = cluster;

        // Plot Attractions (Yellow pins)
        (attractions || []).forEach((attr) => {
          let coords = attr.coords || [destCoords[0] + (Math.random() - 0.5) * 0.05, destCoords[1] + (Math.random() - 0.5) * 0.05];
          const attrIcon = L.divIcon({
            className: 'custom-attr-icon',
            html: `<div style="background-color: #feca57; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 8px #feca57;"></div>`
          });
          const m = L.marker(coords, { icon: attrIcon }).bindPopup(`<b>Sightseeing:</b> ${attr.name}<br>${attr.desc}<br><b>Entry Fee:</b> ₹${attr.fee}`);
          cluster.addLayer(m);
          markerLayers.current.push(m);
        });

        // Plot Hidden Gems (Teal pins)
        (hidden_gems || []).forEach((gem) => {
          let coords = gem.coords || [destCoords[0] + (Math.random() - 0.5) * 0.06, destCoords[1] + (Math.random() - 0.5) * 0.06];
          const gemIcon = L.divIcon({
            className: 'custom-gem-icon',
            html: `<div style="background-color: #1dd1a1; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 8px #1dd1a1;"></div>`
          });
          const m = L.marker(coords, { icon: gemIcon }).bindPopup(`<b>Hidden Gem:</b> ${gem.name}<br>${gem.desc}<br><b>Rating:</b> SECURE EXCURSION`);
          cluster.addLayer(m);
          markerLayers.current.push(m);
        });

        // Plot Hotels & Homestays (Violet pins with hotel icon)
        const hotels = tripData?.hotels || getDynamicHotels(destCity);
        const budgetCat = tripData?.budget_category || 'medium';
        let filteredHotels = hotels;
        if (budgetCat === 'low') {
          filteredHotels = [hotels[0], hotels[1]].filter(Boolean);
        } else if (budgetCat === 'medium') {
          filteredHotels = [hotels[2], hotels[3]].filter(Boolean);
        } else if (budgetCat === 'high') {
          filteredHotels = [hotels[4], hotels[5]].filter(Boolean);
        }

        filteredHotels.forEach((hotel, hIdx) => {
          let coords;
          if (hotel.coords) {
            coords = hotel.coords.split(',').map(c => parseFloat(c.trim()));
          } else {
            coords = [destCoords[0] + (hIdx + 1) * 0.007 * (Math.random() > 0.5 ? 1 : -1), destCoords[1] + (hIdx + 1) * 0.007 * (Math.random() > 0.5 ? -1 : 1)];
            hotel.coords = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
          }

          const hotelIcon = L.divIcon({
            className: 'custom-hotel-icon',
            html: `<div style="background-color: #a855f7; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);"><i class="fa-solid fa-hotel" style="font-size: 11px;"></i></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          
          const popupContent = `
            <div style="width: 220px; font-family: 'Inter', sans-serif; color: #fff; background: rgba(15, 22, 34, 0.95); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.5);">
              <img src="${hotel.photo}" style="width: 100%; height: 110px; object-fit: cover; display: block;" />
              <div style="padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-family: 'Outfit', sans-serif; font-weight: bold; font-size: 13px; color: #fff; line-height: 1.3;">${hotel.name}</div>
                <div style="font-size: 9px; color: #a855f7; font-weight: bold; text-transform: uppercase;">
                  <i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i>${hotel.location}
                </div>
                <p style="font-size: 10px; color: #cbd5e1; line-height: 1.4; margin: 4px 0 6px 0;">${hotel.desc}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 6px; font-size: 10px; margin-top: 2px;">
                  <span style="color: #feca57; font-weight: 800;">₹${hotel.price.toLocaleString('en-IN')} / night</span>
                  <span style="font-size: 8px; font-weight: bold; text-transform: uppercase; background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); padding: 1px 4px; border-radius: 4px;">Stay</span>
                </div>
              </div>
            </div>
          `;

          const m = L.marker(coords, { icon: hotelIcon }).bindPopup(popupContent, { maxWidth: 220, closeButton: false });
          cluster.addLayer(m);
          markerLayers.current.push(m);
        });

        // Plot Restaurants (Orange pins with food icon)
        const restaurants = getDynamicRestaurants(destCity);
        restaurants.forEach((rest, rIdx) => {
          let coords;
          if (rest.coords) {
            coords = rest.coords.split(',').map(c => parseFloat(c.trim()));
          } else {
            coords = [destCoords[0] + (rIdx + 1.5) * 0.009 * (Math.random() > 0.5 ? -1 : 1), destCoords[1] + (rIdx + 1.5) * 0.009 * (Math.random() > 0.5 ? 1 : -1)];
            rest.coords = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
          }

          const restIcon = L.divIcon({
            className: 'custom-rest-icon',
            html: `<div style="background-color: #f97316; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 0 10px rgba(249, 115, 22, 0.6);"><i class="fa-solid fa-utensils" style="font-size: 11px;"></i></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const popupContent = `
            <div style="width: 220px; font-family: 'Inter', sans-serif; color: #fff; background: rgba(15, 22, 34, 0.95); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.5);">
              <img src="${rest.photo}" style="width: 100%; height: 110px; object-fit: cover; display: block;" />
              <div style="padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-family: 'Outfit', sans-serif; font-weight: bold; font-size: 13px; color: #fff; line-height: 1.3;">${rest.name}</div>
                <div style="font-size: 9px; color: #f97316; font-weight: bold; text-transform: uppercase;">
                  <i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i>${rest.location}
                </div>
                <p style="font-size: 10px; color: #cbd5e1; line-height: 1.4; margin: 4px 0 6px 0;">${rest.desc}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 6px; font-size: 10px; gap: 4px; margin-top: 2px; overflow: hidden;">
                  <span style="color: #ff6b6b; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">🍴 ${rest.cuisine}</span>
                  <span style="font-size: 8px; font-weight: bold; text-transform: uppercase; background: rgba(249, 115, 22, 0.15); color: #fdba74; border: 1px solid rgba(249, 115, 22, 0.3); padding: 1px 4px; border-radius: 4px; white-space: nowrap;">Food</span>
                </div>
              </div>
            </div>
          `;

          const m = L.marker(coords, { icon: restIcon }).bindPopup(popupContent, { maxWidth: 220, closeButton: false });
          cluster.addLayer(m);
          markerLayers.current.push(m);
        });

        // Add cluster group to map
        cluster.addTo(mapInstance.current);

        // Fetch OSRM Road Polyline Routing
        let polylineCoords = [startCoords, destCoords];
        try {
          const routingUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
          const routingRes = await fetch(routingUrl);
          if (routingRes.ok) {
            const routingData = await routingRes.json();
            if (routingData.routes && routingData.routes.length > 0) {
              const geojsonCoords = routingData.routes[0].geometry.coordinates;
              polylineCoords = geojsonCoords.map(coord => [coord[1], coord[0]]);
            }
          }
        } catch (e) {
          console.warn("Failed to load OSRM routing, drawing direct line instead:", e);
        }

        routePolyline.current = L.polyline(polylineCoords, {
          color: '#818cf8',
          weight: 4,
          opacity: 0.85,
          lineCap: 'round'
        }).addTo(mapInstance.current);

        // Fit bounds gracefully based on endpoints
        const group = new L.featureGroup([startMarker, destMarker]);
        mapInstance.current.fitBounds(group.getBounds().pad(0.15));

        // Delay invalidation size to resolve leaflet rendering issues inside hidden tabs
        setTimeout(() => {
          mapInstance.current.invalidateSize();
        }, 200);

      } catch (err) {
        console.error("Geocoding map failed:", err);
      }
    };

    geocodeAndPlot();
  }, [tripData]);

  // Fly to and focus on target coordinate when mapFocus updates
  useEffect(() => {
    if (!mapInstance.current || !mapFocus || !mapFocus.coords) return;

    let targetCoords = null;
    if (typeof mapFocus.coords === 'string') {
      targetCoords = mapFocus.coords.split(',').map(c => parseFloat(c.trim()));
    } else if (Array.isArray(mapFocus.coords)) {
      targetCoords = mapFocus.coords;
    }

    if (!targetCoords || targetCoords.length < 2) return;

    // Smooth scroll map container into center view
    const mapElement = document.getElementById('map-container');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Fly to target coordinate with high zoom close-up
    mapInstance.current.flyTo(targetCoords, 14, {
      animate: true,
      duration: 1.5
    });

    // Find and trigger popup after flight completes
    setTimeout(() => {
      const targetMarker = markerLayers.current.find(marker => {
        const mCoords = marker.getLatLng();
        return Math.abs(mCoords.lat - targetCoords[0]) < 0.001 && Math.abs(mCoords.lng - targetCoords[1]) < 0.001;
      });

      if (targetMarker) {
        targetMarker.openPopup();
      }
    }, 1600);
  }, [mapFocus]);

  return (
    <div className="relative w-full">
      <div ref={mapRef} id="map-container"></div>
      <div className="absolute bottom-3 left-3 z-[1000] glass-panel px-3 py-1 text-[10px] text-slate-400 font-medium">
        <i className="fa-solid fa-map-location-dot text-sunsetCoral mr-1"></i> Interactive Route Visualizer
      </div>
    </div>
  );
};

export default MapView;
