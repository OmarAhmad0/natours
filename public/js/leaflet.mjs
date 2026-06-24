
/* eslint-disable */
//const mapElement = document.getElementById('map')

export const displayMap = (mapElement) =>{
    if (mapElement) {
  const locations = JSON.parse(mapElement.dataset.locations);

  

  const map = L.map('map', { zoomControl: false });

  

  const cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: cartodbAttribution
  }).addTo(map);


  const markerIcon = L.icon({
      iconUrl: '/img/pin.png',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40]
  });

  const points = [];

  locations.forEach(loc => {
      const [lng, lat] = loc.coordinates;
      const flippedCoordinates = [lat, lng];
      
      points.push(flippedCoordinates);

      L.marker(flippedCoordinates, { icon: markerIcon })
          .addTo(map)
          .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
              autoClose: false,
              closeOnClick: false,
              className: 'mapboxgl-popup' 
          })
          .openPopup();
  });


  map.fitBounds(points, {
      padding: [100, 100] 
  });
}

}



