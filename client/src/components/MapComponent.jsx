import React, { useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px',
    marginBottom: '1rem'
};

const center = {
    lat: 28.6139,
    lng: 77.2090
};

const MapComponent = ({ steps, mode }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_MAP_API_KEY || "AIzaSyApvMBTVVkFgXtFUFcZ9Qr3zJyeHO4l7bA" // Fallback or Env
    });

    const [directions, setDirections] = useState(null);

    // Filter relevant steps that have coordinates
    const routeSteps = useMemo(() => {
        if (!steps || steps.length === 0) return [];
        return steps.filter(s => s.fromCoords && s.toCoords);
    }, [steps]);

    useEffect(() => {
        if (isLoaded && routeSteps.length > 0) {
            const directionsService = new window.google.maps.DirectionsService();

            const origin = routeSteps[0].fromCoords;
            const destination = routeSteps[routeSteps.length - 1].toCoords;

            const waypoints = routeSteps.slice(1, -1).map(step => ({
                location: step.fromCoords,
                stopover: true
            }));

            // Map internal mode to Google Maps TravelMode
            // 'train' maps to TRANSIT
            // 'bus' maps to TRANSIT (or DRIVING if private bus, but usually transit)
            let travelMode = window.google.maps.TravelMode.DRIVING;
            if (mode === 'walking') travelMode = window.google.maps.TravelMode.WALKING;
            if (mode === 'transit' || mode === 'train') travelMode = window.google.maps.TravelMode.TRANSIT;

            directionsService.route({
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                travelMode: travelMode,
            }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            });
        }
    }, [isLoaded, routeSteps, mode]);


    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
        >
            {directions && (
                <DirectionsRenderer
                    directions={directions}
                    options={{
                        polylineOptions: {
                            strokeColor: mode === 'train' ? '#ff9900' : '#00bfa5',
                            strokeWeight: 5
                        }
                    }}
                />
            )}

            {/* Live Location Marker if available (first step often user location) */}
            {routeSteps.length > 0 && (
                <Marker position={routeSteps[0].fromCoords} label="A" />
            )}
        </GoogleMap>
    );
};

export default React.memo(MapComponent);
