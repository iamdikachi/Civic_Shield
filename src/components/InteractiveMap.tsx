import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Map as MapIcon, Layers } from "lucide-react";

interface MapPinInfo {
  id: string;
  latitude: number;
  longitude: number;
  category: string;
  status: string;
  address: string;
}

interface InteractiveMapProps {
  pins?: MapPinInfo[];
  activePin?: { latitude: number; longitude: number; address?: string } | null;
  onPinDrop?: (lat: number, lng: number, address: string) => void;
  onPinClick?: (pinId: string) => void;
  heatmapMode?: boolean;
  readOnly?: boolean;
  heightClass?: string;
}

// Map Dimensions
// Representing Latitude 40.7000 to 40.7300 (vertical) and Longitude -74.0200 to -73.9900 (horizontal)
const LAT_MIN = 40.7000;
const LAT_MAX = 40.7300;
const LNG_MIN = -74.0200;
const LNG_MAX = -73.9900;

export default function InteractiveMap({
  pins = [],
  activePin = null,
  onPinDrop,
  onPinClick,
  heatmapMode = false,
  readOnly = false,
  heightClass = "h-[450px]"
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Convert GPS Coordinates to container percentage positions (x, y)
  const getCoordinatesPct = (lat: number, lng: number) => {
    // Latitude is vertical (y-axis goes down, so invert: max lat is top (0%), min lat is bottom (100%))
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
    // Longitude is horizontal (x-axis goes right: min lng is left (0%), max lng is right (100%))
    const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  };

  // Convert percentage positions (x, y) to GPS coordinates
  const getGpsFromPct = (x: number, y: number) => {
    const lat = LAT_MAX - (y / 100) * (LAT_MAX - LAT_MIN);
    const lng = LNG_MIN + (x / 100) * (LNG_MAX - LNG_MIN);
    return { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) };
  };

  const getZoneFromCoords = (lat: number, lng: number): string => {
    if (lat > 40.7200) {
      if (lng < -74.0050) return "Suburban North";
      return "Downtown (North)";
    } else {
      if (lng < -74.0100) return "Residential West";
      if (lng > -73.9980) return "Industrial East";
      return "Downtown (South)";
    }
  };

  const generateAddress = (lat: number, lng: number): string => {
    const zone = getZoneFromCoords(lat, lng);
    const streets: { [key: string]: string[] } = {
      "Suburban North": ["Highland Blvd", "Greenway Lane", "Parkview Drive"],
      "Downtown (North)": ["Oak Avenue", "5th Street", "Broadway", "Civic Plaza"],
      "Downtown (South)": ["Wall Street", "Market Rd", "Marina Boulevard"],
      "Residential West": ["Maple Street", "Sunset Avenue", "Pine Street"],
      "Industrial East": ["Dock Road", "Warehouse Way", "Terminal Road"]
    };
    const activeStreets = streets[zone] || ["Main Street"];
    const street = activeStreets[Math.abs(Math.floor(lat * 10000 + lng * 10000)) % activeStreets.length];
    const number = Math.abs(Math.floor(lat * 739 + lng * 911)) % 350 + 1;
    return `${number} ${street}, ${zone}`;
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onPinDrop || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const coords = getGpsFromPct(x, y);
    const address = generateAddress(coords.lat, coords.lng);
    onPinDrop(coords.lat, coords.lng, address);
  };

  const handleUseMyLocation = () => {
    if (readOnly || !onPinDrop) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Normalize user location to be within our city's sandbox for preview purposes
          // Otherwise coordinates are off our custom city map!
          // We can map user's coordinate relative deviation or simply mock it close to a real center
          const lat = parseFloat((40.7100 + (Math.random() - 0.5) * 0.015).toFixed(4));
          const lng = parseFloat((-74.0050 + (Math.random() - 0.5) * 0.015).toFixed(4));
          const address = generateAddress(lat, lng);
          onPinDrop(lat, lng, address);
        },
        () => {
          // Fallback if permission denied
          const lat = 40.7150;
          const lng = -74.0080;
          const address = generateAddress(lat, lng);
          onPinDrop(lat, lng, address);
        }
      );
    }
  };

  // Color mappings based on status or category
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted": return "bg-blue-500 ring-blue-300";
      case "Under Review": return "bg-amber-500 ring-amber-300";
      case "Investigating": return "bg-indigo-500 ring-indigo-300";
      case "Resolved/Closed": return "bg-emerald-500 ring-emerald-300";
      default: return "bg-gray-500 ring-gray-300";
    }
  };

  return (
    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col shadow-sm">
      {/* Map Control Info bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-indigo-600" />
          <span>City Map: Metro Heights Division</span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 transition shadow-xs text-indigo-700 font-semibold cursor-pointer"
          >
            <Navigation className="w-3 h-3 text-indigo-600 animate-pulse" />
            Use My Location
          </button>
        )}
      </div>

      {/* The Map Graphic */}
      <div
        ref={containerRef}
        onClick={handleMapClick}
        className={`relative w-full ${heightClass} overflow-hidden cursor-crosshair select-none`}
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1.5px)",
          backgroundSize: "20px 20px"
        }}
      >
        {/* SVG background grid and zones */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {/* Border grids */}
          <line x1="33%" y1="0%" x2="33%" y2="100%" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="66%" y1="0%" x2="66%" y2="100%" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Static Map Features (Rivers, Parks, Roads) for visual high fidelity */}
        {/* River */}
        <div className="absolute top-0 bottom-0 left-[20%] w-[12%] bg-blue-100/40 pointer-events-none transform -skew-x-12 flex items-center justify-center">
          <span className="text-[10px] tracking-widest text-blue-300/80 uppercase font-bold select-none rotate-90">
            Hudson Cut River
          </span>
        </div>

        {/* Central Park */}
        <div className="absolute top-[25%] left-[45%] w-[15%] h-[20%] bg-emerald-50/70 border border-emerald-100 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="text-[9px] text-emerald-600/50 uppercase font-semibold">Civic Park</span>
        </div>

        {/* Industrial Yards */}
        <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-amber-50/50 border border-amber-100 rounded pointer-events-none flex items-center justify-center">
          <span className="text-[9px] text-amber-700/40 uppercase font-semibold">East Shipyards</span>
        </div>

        {/* Zones Label Overlays */}
        <div className="absolute top-6 left-6 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Suburban North
        </div>
        <div className="absolute top-6 right-6 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Downtown (North)
        </div>
        <div className="absolute bottom-6 left-6 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Residential West
        </div>
        <div className="absolute bottom-6 right-6 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Industrial East
        </div>
        <div className="absolute top-[52%] left-[45%] text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Downtown (South)
        </div>

        {/* HEATMAP LAYER */}
        {heatmapMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Render large blurry red/orange circles around high density pins */}
            {pins.map((p, idx) => {
              const { x, y } = getCoordinatesPct(p.latitude, p.longitude);
              return (
                <div
                  key={`heat-${idx}`}
                  className="absolute w-24 h-24 -mt-12 -ml-12 rounded-full bg-red-500/15 blur-xl animate-pulse"
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              );
            })}
          </div>
        )}

        {/* RENDER ALL ACTIVE PINS (FOR STAFF VIEWS) */}
        {!heatmapMode && pins.map((p) => {
          const { x, y } = getCoordinatesPct(p.latitude, p.longitude);
          const isResolved = p.status === "Resolved/Closed";
          return (
            <button
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onPinClick) onPinClick(p.id);
              }}
              className="absolute group -mt-4 -ml-2.5 transition-all hover:scale-125 z-10 cursor-pointer flex flex-col items-center"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${p.category} (${p.id}) - Click to View`}
            >
              <MapPin
                className={`w-5 h-5 drop-shadow-md text-white rounded-full p-1 border border-white ${getStatusColor(p.status)}`}
              />
              <span className="hidden group-hover:block absolute top-6 bg-slate-900 text-white text-[9px] rounded px-1.5 py-0.5 whitespace-nowrap z-20 shadow">
                {p.id}: {p.category}
              </span>
            </button>
          );
        })}

        {/* ACTIVE DROP PIN (FOR REPORTING WIZARD OR DETAIL VIEWS) */}
        {activePin && (
          (() => {
            const { x, y } = getCoordinatesPct(activePin.latitude, activePin.longitude);
            return (
              <div
                className="absolute -mt-6 -ml-3.5 z-20 pointer-events-none flex flex-col items-center"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {/* Visual ripple to highlight active pin drop */}
                <span className="absolute w-8 h-8 -mt-1 rounded-full bg-indigo-500/30 animate-ping" />
                <MapPin className="w-7 h-7 text-indigo-600 fill-indigo-200 drop-shadow-lg" />
                <div className="bg-indigo-900 text-white text-[9px] rounded-md px-2 py-0.5 whitespace-nowrap shadow mt-1">
                  Incident Pin
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Map Footer status */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        {activePin ? (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700">Selected Location:</span>
            <span>{activePin.address || "Resolving address..."}</span>
            <span className="font-mono text-[10px] text-slate-400">
              Coordinates: {activePin.latitude.toFixed(4)}, {activePin.longitude.toFixed(4)}
            </span>
          </div>
        ) : (
          <span>
            {readOnly
              ? `Displaying ${pins.length} logged incident reports across zones.`
              : "Click/tap anywhere on the grid map to drop a precise incident location pin."}
          </span>
        )}

        {!heatmapMode && pins.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Submitted
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Review
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Investigating
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Resolved
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
