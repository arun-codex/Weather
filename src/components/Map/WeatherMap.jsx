import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Maximize2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getIsDay } from '../../utils/formatters';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
const MAP_LAYER_IDS = ['layer-precipitation', 'layer-temperature', 'layer-wind'];

function MissingMapTokenState() {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden glass relative border border-white/10 z-0 p-8 flex flex-col justify-between">
      <div className="space-y-4">
        <p className="text-white text-xl font-semibold">Map unavailable</p>
        <p className="text-white/70 max-w-md leading-relaxed">
          Add `VITE_MAPBOX_TOKEN` to your `.env` file to enable the interactive
          weather map and the full-screen Mapbox demo.
        </p>
        <code className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-blue-200">
          VITE_MAPBOX_TOKEN=your_public_mapbox_token_here
        </code>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/50">
          Restart the dev server after adding the token so Vite can load the new env var.
        </p>
        <a
          href="https://docs.mapbox.com/help/getting-started/access-tokens/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/50"
        >
          Get token
        </a>
      </div>
    </div>
  );
}

export default function WeatherMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const coords = useStore((state) => state.coords);
  const activeLayer = useStore((state) => state.activeLayer);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 1. Initialize Map
  useEffect(() => {
    if (!MAPBOX_TOKEN || map.current || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Choose style based on time of day
    const isDay = getIsDay();
    const style = isDay 
      ? 'mapbox://styles/mapbox/navigation-day-v1' 
      : 'mapbox://styles/mapbox/navigation-night-v1';
    
    const center = coords ? [coords.lon, coords.lat] : [-98.5795, 39.8283];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: center,
      zoom: coords ? 10 : 3.5,
      pitch: 45,
      antialias: true
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      // Add Sources
      map.current.addSource('precipitation-tiles', {
        type: 'raster',
        tiles: ['https://tilecache.rainviewer.com/v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png'],
        tileSize: 256
      });

      map.current.addSource('temperature-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: Array.from({ length: 400 }, () => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [ -125 + Math.random() * 60, 25 + Math.random() * 25 ] },
            properties: { temp: Math.floor(Math.random() * 100) }
          }))
        }
      });

      map.current.addSource('wind-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: Array.from({ length: 200 }, () => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [ -120 + Math.random() * 50, 30 + Math.random() * 20 ] },
            properties: { speed: Math.random() * 30, bearing: Math.floor(Math.random() * 360) }
          }))
        }
      });

      // Add Layers (Hidden by default)
      map.current.addLayer({
        id: 'layer-precipitation',
        type: 'raster',
        source: 'precipitation-tiles',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.7 }
      });

      map.current.addLayer({
        id: 'layer-temperature',
        type: 'heatmap',
        source: 'temperature-data',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'temp'], 0, 0, 100, 1],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': 0.6
        }
      });

      map.current.addLayer({
        id: 'layer-wind',
        type: 'symbol',
        source: 'wind-data',
        layout: {
          'text-field': '↑',
          'text-size': 24,
          'text-rotate': ['get', 'bearing'],
          'text-rotation-alignment': 'map',
          'visibility': 'none'
        },
        paint: {
          'text-color': '#0A84FF',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      setMapLoaded(true);
    });

    return () => {
      // We don't remove Mapbox instance on hot reload to prevent issues, 
      // but strictly we should clean it up:
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency ensures map is only initialized once

  // 2. Sync Coordinates (Fly to)
  useEffect(() => {
    if (!map.current || !coords || !mapLoaded) return;
    map.current.flyTo({
      center: [coords.lon, coords.lat],
      zoom: 10,
      essential: true,
      duration: 2000
    });
  }, [coords, mapLoaded]);

  // 3. Sync Active Layer Toggle
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Hide all layers first
    MAP_LAYER_IDS.forEach((layerId) => {
      if (map.current.getLayer(layerId)) {
         map.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Show the active layer from MapLayers control
    if (activeLayer !== 'none' && map.current.getLayer(`layer-${activeLayer}`)) {
      map.current.setLayoutProperty(`layer-${activeLayer}`, 'visibility', 'visible');
    }
  }, [activeLayer, mapLoaded]);

  if (!MAPBOX_TOKEN) {
    return <MissingMapTokenState />;
  }

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden glass relative border border-white/10 z-0 mapbox-wrapper group">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Decorative inset shadow to overlay Mapbox's canvas */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] z-10" />
      {/* Link to full environment map */}
      <a 
        href="/mapbox-demo.html"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 right-6 z-20 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20 transition-all flex items-center gap-2 shadow-lg hover:scale-105"
      >
        <Maximize2 size={16} />
        <span>Explore Full Map</span>
      </a>
    </div>
  );
}
