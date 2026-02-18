import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { QRCodeCanvas } from "qrcode.react";
import { Car, MapPin, Smartphone, AlertTriangle } from "lucide-react";

import { StatusOverlayData } from "../types/app.types";

interface TrafficPopupProps {
  routeData: StatusOverlayData; // StatusOverlayData enrichment
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "8px",
};

const TrafficPopup: React.FC<TrafficPopupProps> = ({ routeData }) => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Utilisation de useJsApiLoader pour une meilleure gestion du chargement
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
    language: "fr",
  });

  // Calcul de l'itinéraire une fois l'API chargée
  useEffect(() => {
    if (
      !isLoaded ||
      !routeData?.origin ||
      !routeData?.destination ||
      !window.google
    ) {
      return;
    }

    const calculateRoute = () => {
      const directionsService = new window.google.maps.DirectionsService();

      // Reset directions and error when routeData changes or API loads/unloads
      setDirections(null);
      setError(null);

      if (isLoaded && routeData?.origin && routeData?.destination) {
        console.log("📍 TrafficPopup: Preparing to calculate route...", {
          origin: routeData.origin,
          destination: routeData.destination,
        });

        directionsService.route(
          {
            origin: routeData.origin,
            destination: routeData.destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            drivingOptions: {
              departureTime: new Date(), // Pour le trafic temps réel
              trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
            },
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              console.log("📍 TrafficPopup: Route OK", result);
              setDirections(result);
              setError(null);
            } else {
              console.error(
                `📍 TrafficPopup: Error fetching directions ${status}`,
                result,
              );
              if (status === window.google.maps.DirectionsStatus.ZERO_RESULTS) {
                setError("Adresse non localisable sur la carte.");
              } else if (
                status === window.google.maps.DirectionsStatus.NOT_FOUND
              ) {
                setError("Adresse introuvable.");
              } else {
                setError(`Erreur carte: ${status}`);
              }
            }
          },
        );
      }
    };

    // Petit délai pour s'assurer que le container de la map est prêt ou que Google a fini de s'init
    const timer = setTimeout(() => {
      calculateRoute();
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, routeData]);

  // Lien Google Maps pour le téléphone
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    routeData?.origin || "",
  )}&destination=${encodeURIComponent(routeData?.destination || "")}&travelmode=driving`;

  // Gestion des erreurs de chargement de l'API
  if (loadError) {
    return (
      <div className="p-4 text-red-400">
        Erreur de chargement Google Maps API
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 p-2 text-cyan-50 font-mono">
      {/* Colonne Gauche : Infos & QR */}
      <div className="w-1/3 flex flex-col gap-6">
        {/* Infos Trajet */}
        <div className="bg-cyan-950/30 border border-cyan-500/30 p-4 rounded-lg flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-2">
            <Car className="text-cyan-400" size={20} />
            <span className="text-lg font-bold tracking-wider text-cyan-300">
              ITINÉRAIRE
            </span>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-cyan-500/70 uppercase">Distance</span>
              <span className="text-xl font-bold">{routeData?.distance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyan-500/70 uppercase">Durée estimée</span>
              <span className="text-xl font-bold text-yellow-400">
                {routeData?.duration}
              </span>
            </div>
            {routeData?.durationInTraffic && (
              <div className="flex justify-between items-center">
                <span className="text-cyan-500/70 uppercase text-xs">
                  Avec Trafic
                </span>
                <span className="text-sm font-bold text-red-400">
                  {routeData?.durationInTraffic}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-cyan-500/20">
            <div className="flex items-start gap-2">
              <div className="mt-1 min-w-[16px]">
                <div className="w-3 h-3 rounded-full border-2 border-cyan-500" />
              </div>
              <span className="text-xs text-cyan-100/80 break-words leading-tight">
                {routeData?.origin}
              </span>
            </div>
            <div className="ml-[5px] w-[2px] h-4 bg-cyan-500/30" />
            <div className="flex items-start gap-2">
              <div className="mt-1 min-w-[16px]">
                <MapPin size={14} className="text-red-500" />
              </div>
              <span className="text-xs text-cyan-100/80 break-words leading-tight">
                {routeData?.destination}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex-1 bg-white/5 border border-cyan-500/30 p-4 rounded-lg flex flex-col items-center justify-center gap-4">
          <Smartphone className="text-cyan-400" size={24} />
          <div className="bg-white p-2 rounded">
            <QRCodeCanvas value={mapsUrl} size={140} />
          </div>
          <span className="text-xs text-center text-cyan-500/80 uppercase tracking-widest">
            Scanner pour envoyer au mobile
          </span>
        </div>
      </div>

      {/* Colonne Droite : Map */}
      <div className="flex-1 bg-cyan-950/20 border border-cyan-500/30 rounded-lg overflow-hidden relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            // Retrait du center/zoom hardcodés qui forcent le reset
            options={{
              disableDefaultUI: true,
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                {
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#242f3e" }],
                },
                {
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry",
                  stylers: [{ color: "#746855" }],
                },
              ],
            }}
            onLoad={(map) => {
              // Si on a déjà des directions, on fit les bounds
              if (directions && directions.routes[0]?.bounds) {
                map.fitBounds(directions.routes[0].bounds);
              } else {
                // Sinon vue par défaut (Paris) en attendant
                map.setCenter({ lat: 48.8566, lng: 2.3522 });
                map.setZoom(12);
              }
            }}
          >
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: {
                    strokeColor: "#00CED1", // Cyan
                    strokeWeight: 5,
                  },
                  suppressMarkers: false, // On garde les markers A/B par défaut
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-cyan-400">Chargement Google Maps...</span>
          </div>
        )}

        {/* Overlay si chargement itinéraire (après chargement API) */}
        {isLoaded && !directions && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-cyan-400 text-sm">
                Calcul de l'itinéraire visuel...
              </span>
            </div>
          </div>
        )}

        {/* Overlay Erreur */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="text-red-500" size={32} />
              <span className="text-red-400 font-bold">Erreur itinéraire</span>
              <span className="text-cyan-200/70 text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficPopup;
