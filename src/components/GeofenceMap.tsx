import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { IonIcon } from "@ionic/react";
import { locateOutline } from "ionicons/icons";

interface GeofenceMapProps {
  empresaLat: number;
  empresaLng: number;
  radioMetros: number;
  userLat: number | null;
  userLng: number | null;
  razonSocial: string;
  nombreEmpleado: string;
}

const empresaIcon = L.divIcon({
  className: "custom-empresa-icon",
  html: `<div style="background-color:#2563eb; width:36px; height:36px; borderRadius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; border:3px solid white; box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);">🏢</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIcon = L.divIcon({
  className: "custom-user-icon",
  html: `<div style="background-color:#10b981; width:36px; height:36px; borderRadius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; border:3px solid white; box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const RecenterControl: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control" style={{ margin: '10px' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            map.setView([lat, lng], 16, { animate: true });
          }}
          className="bg-white text-blue-600 w-10 h-10 flex items-center justify-center rounded-xl shadow-md cursor-pointer hover:bg-slate-50 border border-slate-200"
          title="Enfocar mi ubicación"
        >
          <IonIcon icon={locateOutline} style={{ fontSize: '20px' }} />
        </button>
      </div>
    </div>
  );
};

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  empresaLat,
  empresaLng,
  radioMetros,
  userLat,
  userLng,
  razonSocial,
  nombreEmpleado,
}) => {
  const isInside =
    userLat !== null && userLng !== null
      ? L.latLng(userLat, userLng).distanceTo(
          L.latLng(empresaLat, empresaLng)
        ) <= radioMetros
      : false;

  const centerLat = userLat ?? empresaLat;
  const centerLng = userLng ?? empresaLng;

  return (
    <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapResizer />
        <MapRecenter lat={centerLat} lng={centerLng} />
        <RecenterControl lat={centerLat} lng={centerLng} />

        <Circle
          center={[empresaLat, empresaLng]}
          radius={radioMetros}
          pathOptions={{
            color: isInside ? "#10b981" : "#ef4444",
            fillColor: isInside ? "#10b981" : "#ef4444",
            fillOpacity: 0.2,
            weight: 2,
            dashArray: "6, 6",
          }}
        />

        <Marker position={[empresaLat, empresaLng]} icon={empresaIcon}>
          <Popup>
            <div className="text-xs font-sans">
              <strong className="block text-slate-900">{razonSocial}</strong>
              <span className="text-slate-600">Perímetro: {radioMetros}m</span>
            </div>
          </Popup>
        </Marker>

        {userLat !== null && userLng !== null && (
          <>
            <Marker position={[userLat, userLng]} icon={userIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong className="block text-slate-900">
                    {nombreEmpleado || "Tu Ubicación"}
                  </strong>
                  <span
                    className={
                      isInside
                        ? "text-emerald-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {isInside ? "Dentro de Sucursal" : "Fuera del Perímetro"}
                  </span>
                </div>
              </Popup>
            </Marker>

            <Polyline
              positions={[
                [empresaLat, empresaLng],
                [userLat, userLng],
              ]}
              pathOptions={{
                color: isInside ? "#10b981" : "#ef4444",
                dashArray: "4, 4",
                weight: 2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default GeofenceMap;
