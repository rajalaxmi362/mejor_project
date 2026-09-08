import * as maplibregl from "https://unpkg.com/maplibre-gl@6.6.0/dist/maplibre-gl.mjs";

// Get listing data
const listingData = document.getElementById("listing-data");

// Get coordinates safely
let coordinates = null;

try {
  coordinates = JSON.parse(listingData.dataset.coordinates);
} catch (error) {
  console.log("Could not read coordinates:", error);
}

// Validate coordinates
if (
  !Array.isArray(coordinates) ||
  coordinates.length !== 2 ||
  !Number.isFinite(Number(coordinates[0])) ||
  !Number.isFinite(Number(coordinates[1]))
) {
  coordinates = null;
}

// Fallback location: Bhubaneswar
const mapCenter = coordinates
  ? [Number(coordinates[0]), Number(coordinates[1])]
  : [85.8245, 20.2961];

// Create map
const map = new maplibregl.Map({
  container: "map",

  style: {
    version: 8,

    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },

    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  },

  center: mapCenter,
  zoom: coordinates ? 12 : 10,
});

// Navigation controls
map.addControl(new maplibregl.NavigationControl(), "top-right");

// Map loaded
map.on("load", () => {
  console.log("MAP LOADED SUCCESSFULLY");

  // Add marker and popup
  if (coordinates) {
    const popup = new maplibregl.Popup({
      offset: 25,
    }).setHTML(`
      <h5>${listingData.dataset.title}</h5>
      <p>${listingData.dataset.location}</p>
      <p>${listingData.dataset.country}</p>
    `);

    new maplibregl.Marker()
      .setLngLat([Number(coordinates[0]), Number(coordinates[1])])
      .setPopup(popup)
      .addTo(map);
  }
});

// Map errors
map.on("error", (e) => {
  console.log("MAP ERROR:", e);
});
