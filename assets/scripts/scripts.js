//CARTE DE MONTRÉAL
const maCarte = L.map("map", { zoomControl: false, minZoom: 10 }).setView(
  [45.558, -73.699],
  10.5
);

//FOND DE CARTE 1
const grisPale = L.esri.Vector.vectorBasemapLayer("ArcGIS:LightGray", {
  apikey: cleAPI,
});
grisPale.addTo(maCarte);

//FOND DE CARTE 2
const grisFonce = L.esri.Vector.vectorBasemapLayer("ArcGIS:DarkGray", {
  apikey: cleAPI,
});

//ATTRIBUTIONS
L.control.attribution().addAttribution("Réalisé par Émilie Caron. Merci à Données Québec pour les infos sur les <a href='https://www.donneesquebec.ca/recherche/dataset/vmtl-murales/resource/d325352b-1c06-4c3a-bf5e-1e4c98e0636b' target='_blank'>murales</a> ainsi que les <a href='https://www.donneesquebec.ca/recherche/dataset/vmtl-pistes-cyclables/resource/0dc6612a-be66-406b-b2d9-59c9e1c65ebf' target='_blank'>pistes cyclables.</a> Merci à ArcGIS pour les infos sur les <a href='https://services1.arcgis.com/YiULsZbgRKmBtdZN/arcgis/rest/services/Montreal_Green_Spaces_WFL1/FeatureServer/3' target='_blank'>espaces verts.</a> ").addTo(maCarte);
  
//SUIVI DE LA POSITION
//Liens vers les boutons
document.getElementById("trouver").addEventListener("click", suiviOn);
document.getElementById("arreter").addEventListener("click", suiviOff);

//icon
var personneIcon = L.icon({
  iconUrl: "./assets/img/geolocalisation.png",
  iconSize: [50, 50],
  iconAnchor: [25, 45],
});

//Groupe
let groupeMarqueurs = L.layerGroup().addTo(maCarte);

//Functions
function suiviOn() {
  maCarte.locate({ watch: true, setView: true });
  maCarte.on("locationfound", trouve);
  maCarte.on("locationerror", erreur);
}
function suiviOff() {
  maCarte.stopLocate();
  groupeMarqueurs.clearLayers();
}
function trouve(e) {
  groupeMarqueurs.clearLayers();
  let marqueur = L.marker(e.latlng, { icon: personneIcon }).addTo(groupeMarqueurs);
  L.circle(e.latlng, {
    color: 'orange',
    fillOpacity: 0.2,
    radius: e.accuracy,
  }).addTo(groupeMarqueurs);
}
function erreur(error) {
  alert("Oups");
}

// COUCHES DES MURALES - POINTS
const groupeMurales = L.layerGroup();

const muraleIcon = L.icon({
  iconUrl: "./assets/img/indicateur-murale.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [-2, -2],
});

murales = L.geoJSON(murales, {
  pointToLayer: function (geoJsonPoint, latlng) {
    return L.marker(latlng, { icon: muraleIcon });
  },
}).addTo(groupeMurales);

murales.bindPopup(function (layer) {
  return `<figure><img src="${layer.feature.properties.image}" alt="Murale réalisée par ${layer.feature.properties.artiste}"> <figcaption>Par ${layer.feature.properties.artiste}<br>Située au ${layer.feature.properties.adresse}</figcaption></figure>`;
});

//Avec le zoom
maCarte.on("zoomend", (e) => {
  if (maCarte.getZoom() > 13) {
    maCarte.addLayer(groupeMurales);
  } else {
    maCarte.removeLayer(groupeMurales);
  }
});

//COUCHE DU RÉSEAU CYCLABLE - LIGNES
reseauCyclable = L.geoJSON(reseauCyclable, {
  style: function (feature) {
    let couleur;
    switch (feature.properties.SAISONS4) {
      case "OUI":
        couleur = "#0e7988";
        break;
      case "NON":
        couleur = "#4bbdcd";
        break;
      default:
        couleur= 'white';
      }
      return { color: couleur };
  }
}).bindPopup(function (layer) {
  return `Cette piste fait ${layer.feature.properties.LONGUEUR.toString()} km et se situe dans le quartier ${layer.feature.properties.NOM_ARR_VI} `;
});

//COUCHES DES ESPACES VERTS - POLYGONES
const urlEspacesVerts =
  "https://services1.arcgis.com/YiULsZbgRKmBtdZN/arcgis/rest/services/Montreal_Green_Spaces_WFL1/FeatureServer/3";

espacesVerts = L.esri
  .featureLayer({
    url: urlEspacesVerts,
    opacity: 1,
    style: function (feature) {
      let couleur;
      if (feature.properties.SUPERFICIE < 10) {
        couleur = "#80c599";
      } else if (
        feature.properties.SUPERFICIE >= 10 &&
        feature.properties.SUPERFICIE < 60
      ) {
        couleur = "#3d8256";
      } else {
        couleur = "#0f4e26";
      }
      return { color: couleur, fillOpacity: 1, weight: 0 };
    },
  })
  .bindPopup(function (layer) {
    return `Parc ${layer.feature.properties.Nom}`;
  })
  .addTo(maCarte);

//CONTROLES DES COUCHES
let baseLayers = {
  "Gris Pâle": grisPale,
  "Gris Foncé": grisFonce,
};
let overlays = {
  "Murales": murales,
  "Piste Cyclables": reseauCyclable,
  "Espaces verts": espacesVerts,
};
L.control.layers(baseLayers, overlays).addTo(maCarte);

// ÉCHELLE
L.control.scale({ 
  position: "bottomright",
  imperial: false, 
  maxWidth: 200 }).addTo(maCarte);

//CONTRÔLE DU ZOOM
L.control
.zoom({
  zoomInTitle: "Zoom avant",
  zoomOutTitle: "Zoom arrière",
})
.addTo(maCarte);
  
//BARRE DE RECHERCHE
const couchePoints = L.layerGroup();
couchePoints.addTo(maCarte);

const searchControl = L.esri.Geocoding.geosearch({
  placeholder: "Entrer une adresse",
  useMapBounds: false,
  providers: [
    L.esri.Geocoding.arcgisOnlineProvider({
      apikey: cleAPI,
      nearby: {
        lat: 46,
        lng: -74,
      },
    }),
  ],
}).addTo(maCarte);

searchControl.on("results", (data) => {
  for (let i = 0; i < data.results.length; i++) {
    couchePoints.clearLayers();
    let marqueur = L.marker(data.results[i].latlng);
    marqueur.bindPopup(data.results[i].text).openPopup();
    marqueur.addTo(couchePoints);
  }
});

