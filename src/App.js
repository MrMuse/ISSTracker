import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken =
  "pk.eyJ1IjoibXVzdGFmYXp1bGtlZmxpIiwiYSI6ImNremU1ZHUzbDMxbW0ybnA0OTFrcnlybTYifQ.uxDasIq8yRde7cfSBX-ygw";

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [d, setD] = useState(0);
  const [t, setT] = useState(0);
  const [tz, setTz] = useState(0);
  const [Objts, setObjTs] = useState("");
  const [ts, setTs] = useState([]);
  
  function fecthData() {
    fetch("http://api.open-notify.org/astros.json")
    .then(respo => {
      if (!respo.ok) {
        throw Error("ERROR");
      }
        return respo.json();
    })
    .then(data => {
      console.log(data)
      const html = data.people.map(astro => {
        return `
        <div class="astro">
        <h1>People On Space</h1>
        <p>Craft: ${astro.craft}</p><br>
        <p>Name: ${astro.name}</p><br><br>
        </div>`;
  })
  .join("");
  document.querySelector("#data").insertAdjacentHTML("afterbegin", html);
})
.catch(error => {
  console.log(error);
});
}
  useEffect(() => {
    
    if (map.current) return; // initialize map only once 
fecthData();
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [lng, lat],
      zoom: 1,
      // projection: "naturalEarth", // starting projection
    });
    
    // disable map rotation using right click + drag
    map.current.dragRotate.disable();
  });

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on("load", async () => {
      // Get the initial location of the International Space Station (ISS).
      const geojson = await getLocation();
      // Add the ISS location as a source.
      map.current.addSource("iss", {
        type: "geojson",
        data: geojson,
      });

      // Add the rocket symbol layer to the map.
      map.current.addLayer({
        id: "iss",
        type: "symbol",
        source: "iss",
        layout: {
          // This icon is a part of the Mapbox Streets style.
          // To view all images available in a Mapbox style, open
          // the style in Mapbox Studio and click the "Images" tab.
          // To add a new image to the style at runtime see
          // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
          "icon-image": "rocket-15",
        },
      });

      // Update the source from the API every 2 seconds.
      const updateSource = setInterval(async () => {
        const geojson = await getLocation(updateSource);
        map.current.getSource("iss").setData(geojson);
      }, 2000);

      async function getLocation(updateSource) {
        // Make a GET request to the API and return the location of the ISS.
        try {
          const response = await fetch(
            "https://api.wheretheiss.at/v1/satellites/25544",
            { method: "GET" }
          );
          const { latitude, longitude, timestamp } = await response.json();
          map.current.on("move", () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            let myDate = new Date(timestamp*1000);
            setD(myDate.toLocaleDateString());
            setT(myDate.toLocaleTimeString());
          });
      
            const response2 = await fetch(
              "https://api.wheretheiss.at/v1/coordinates/"+latitude+","+longitude,
              { method: "GET" });
      
            const { timezone_id } = await response2.json();
            let splitTz = timezone_id.split("/");
            if (/GMT/.test(splitTz[1])) {
              splitTz = "Above The Ocean"
              setTz(splitTz);
            } else {
              setTz(splitTz[1]);
            };
            document.getElementById("btn").addEventListener("click", getDT);
          // Fly the map to the location.
          map.current.flyTo({
            center: [longitude, latitude],
            speed: 0.5,
          });
          // Return the location of the ISS as GeoJSON.
          return {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  timestamp: timestamp,
                  // timezone: timezone_id,
                  coordinates: [longitude, latitude],
                },
              },
            ],
          };
        } catch (err) {
          // If the updateSource interval is defined, clear the interval to stop updating the source.
          if (updateSource) clearInterval(updateSource);
          throw new Error(err);
        }
      }
    });
  });

  function getDT(){
    let inputD = document.getElementById("Date").value.toString();
    let inputT = document.getElementById("Time").value.toString();
    let DT = inputD + " " + inputT;
    let TS = Date.parse(DT);
    let TSA = [];
    let TSI = 0;
    TS = TS/1000;
    TSI = TS;
    // setObjTs(TS.toString()) 
    for (let i = 0; i < 6; i++){
      // setTs([...ts, Objts])
      TS =TS - 600;
      TSA.push(TS.toString())
    }
    console.log(TSA);
    TSA.push(TSI);
    TS = TSI;
    for (let i = 0; i < 6; i++){
      // setTs([...ts, Objts])
      TS =TS + 600;
      TSA.push(TS.toString())
    }
    console.log(TSA);
    fetch("https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps="+ TSA[5] +","+ TSA[4] +","+ TSA[3] +","+ TSA[2] +","+ TSA[1] +","+ TSA[0] +","+ TSA[6] +","+ TSA[7] +","+ TSA[8] +","+ TSA[9] +","+ TSA[10] +","+ TSA[11] +","+ TSA[12])
  .then(res => {
    if (!res.ok) {
      throw Error("ERROR")
    }
    return res.json();
  })
  .then(data => {
    console.log(data)
    const html = data.map(sat => {
        const api_url = "https://api.wheretheiss.at/v1/coordinates/"+sat.latitude+","+sat.longitude
        async function getTz() {
          const response = await fetch(api_url);
          const { timezone_id } = await response.json();
            let splitTz = timezone_id.split("/");
            if (/GMT/.test(splitTz[1])) {
              splitTz = "Above The Ocean";
            } 
            else {
              splitTz = splitTz[1];
            }
            console.log(splitTz);
            return splitTz;
        };
        console.log(getTz());
      let DateTime = new Date(sat.timestamp*1000);
      // DateTime = DateTime.toLocaleDateString();
      alert("Date: "+DateTime.toLocaleDateString()+"\n"+
      "Time: "+DateTime.toLocaleTimeString()+"\n"+
      "Latitude: "+sat.latitude+"\n"+
      "Longtitude: "+sat.longitude+"\n"+
      "City: "+getTz()
      );
      // return `
      // <div class="sat">
      //   <p>Date: <span id="tsdate"/>
      //   Latitude: ${sat.latitude}
      //   Longtitude: ${sat.longitude}</p><br>
      // </div>
      //   <script document.getElementById("tsdate").innerHTML = DateTime; />
      // `; 
    })
    // .join("");
    console.log(html)
    // document.querySelector("#data").insertAdjacentHTML("afterbegin", html)
  })
  .catch(error => {
    console.log(error);
  });
    
    return DT;
  };

  return (
    <div>
      <div className="Container">
      <div className="LogoBar">
        <img
          className="Logo"
          src="https://i.pinimg.com/originals/c1/d8/8c/c1d88c9cc660b726d23f9b68c0d151bd.png"
          alt="Logo"
        />
        ISS Tracker
      </div>
      <div className="Wrapper">
        <div className="Lsidebar">Date: {d} | Time: {t} |</div>
        <div className="Csidebar">City: {tz} |</div>
        <div className="Rsidebar">
          Longitude: {lng} | Latitude: {lat} |
        </div>
      </div>
      <div ref={mapContainer} className="map-container" />
      <form className="Form" id="form1">
        <label for="Date">Date:</label>
        <input type="date" id="Date" name="Date"/>
        <label for="Time">Time:</label>
        <input type="time" id="Time" name="Time"/>
        <input type="button" id="btn" value="Past Locations"/>
      </form>
      <div id="data" className="data"/>
      </div>
    </div>
  );
}
