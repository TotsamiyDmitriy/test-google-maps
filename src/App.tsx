import { GoogleMap, Marker, MarkerClusterer, useJsApiLoader } from '@react-google-maps/api';
import React from 'react';
import Footer from './components/Footer';
import './App.css';
import { db } from './utils/firebase';
import { FirestoreError, addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

type MarkerPosition = {
  lat: number;
  lng: number;
};

export interface MarkerType extends MarkerPosition {
  id: string;
  index: number;
}

type MapProps = {
  center?: MarkerPosition;
};

const defaultOptions: google.maps.MapOptions = {
  panControl: true,
  zoomControl: true,
  scrollwheel: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  clickableIcons: false,
  keyboardShortcuts: false,
  disableDoubleClickZoom: false,
  fullscreenControl: false,
};

const App: React.FC<MapProps> = React.memo(({ center = { lat: -3.745, lng: -38.523 } }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_API_KEY.toString(),
  });

  const [_map, setMap] = React.useState<google.maps.Map | null>(null);
  const colRef = collection(db, 'markers');

  const [markers, setMarkers] = React.useState<MarkerType[]>([]);

  const [selectedMarker, setSelectedMarker] = React.useState<MarkerType>();

  React.useEffect(() => {
    const firestoreFetch = async () => {
      try {
        const markers: MarkerType[] = [];

        const data = await getDocs(colRef);
        data.forEach((doc) => {
          markers.push({ ...doc.data(), id: doc.id } as MarkerType);
        });
        setMarkers(
          markers.sort((a, b): number => {
            if (a.index > b.index) {
              return 1;
            }
            if (a.index < b.index) {
              return -1;
            }
            if (a.index === b.index) {
              return 0;
            }
            return 0;
          }),
        );
      } catch (error) {
        if (error instanceof FirestoreError) {
          throw new Error(error.message);
        }
      }
    };

    firestoreFetch();
    console.log(markers);
  }, []);

  const onLoad = React.useCallback((map: google.maps.Map) => {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);

    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  const onDrag = (e: google.maps.MapMouseEvent, index: number) => {
    if (e.latLng) {
      markers.splice(index, 1, { ...markers[index], lat: e.latLng?.lat(), lng: e.latLng?.lng() });
    }
    console.log(markers);
  };

  const onClick = async (e: google.maps.MapMouseEvent) => {
    if (selectedMarker?.lat) {
      setSelectedMarker(undefined);
    } else if (e.latLng) {
      try {
        setMarkers([
          ...markers,
          { lat: e.latLng.lat(), lng: e.latLng.lng(), index: markers.length++, id: '' },
        ]);
        await addDoc(colRef, {
          lat: e.latLng?.lat(),
          lng: e.latLng?.lng(),
          index: markers.length++,
        });
      } catch (error) {
        console.log(error);
      }
    }
  };

  const onClickMarker = (_e: google.maps.MapMouseEvent, id: number) => {
    setSelectedMarker({ ...markers[id], index: id });
    console.log('selected', id);
  };

  const deleteHandler = async (e: React.MouseEvent<HTMLButtonElement>, selected: MarkerType) => {
    e.preventDefault();
    console.log('DEL');
    setMarkers(markers.filter((_marker, index) => index !== selected.index));
    const docRef = doc(db, 'markers', selected.id);
    await deleteDoc(docRef);
    setSelectedMarker(undefined);
  };

  const deleteAllHandler = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      setMarkers([]);
      setSelectedMarker(undefined);
    } catch (error) {
      console.log(error);
    }
  };

  return isLoaded ? (
    <div className="main">
      <div className={`footer ${selectedMarker ? 'active' : ''}`}>
        {selectedMarker && (
          <Footer
            selectedMarker={selectedMarker}
            deleteHandler={deleteHandler}
            deleteAllHandler={deleteAllHandler}
          />
        )}
      </div>
      <div className="google-map">
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={10}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onClick}
          options={defaultOptions}>
          <MarkerClusterer gridSize={60}>
            {(clusterer) => (
              <div>
                {markers.map((marker, id) => (
                  <Marker
                    clusterer={clusterer}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    onClick={(e) => {
                      onClickMarker(e, id);
                    }}
                    label={`${id}`}
                    key={`${id}`}
                    draggable
                    onDragEnd={(e) => {
                      onDrag(e, id);
                    }}
                  />
                ))}
              </div>
            )}
          </MarkerClusterer>
        </GoogleMap>
      </div>
    </div>
  ) : (
    <></>
  );
});

export default App;
