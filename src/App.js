import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import DeckGL, { ScatterplotLayer } from "deck.gl";
import { StaticMap } from "react-map-gl";
import * as d3 from "d3";

// Set your mapbox access token here
const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1Ijoic3dpemVjIiwiYSI6ImNqcHdnaDR1MDB0bWozeG1tY28wcHVoM2UifQ.RxzaHH4i1_U32eiWoOc_jQ";

// Initial viewport settings
const initialViewState = {
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 5,
    pitch: 0,
    bearing: 0
};

class App extends Component {
    state = { airplanes: [] };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = () => {
        console.log("fetching data");
        d3.json("https://opensky-network.org/api/states/all").then(
            ({ states }) =>
                this.setState({
                    // from https://opensky-network.org/apidoc/rest.html#response
                    airplanes: states.map(d => ({
                        callsign: d[1],
                        longitude: d[5],
                        latitude: d[6],
                        velocity: d[9],
                        altitude: d[13],
                        origin_country: d[2]
                    }))
                })
        );
        setTimeout(this.fetchData, 10 * 1000);
    };

    render() {
        const layers = [
            new ScatterplotLayer({
                id: "scatterpliot-airplanes",
                data: this.state.airplanes,
                pickable: false,
                opacity: 0.8,
                radiusMinPixels: 5,
                radiusMaxPixels: 100,
                getPosition: d => [d.longitude, d.latitude],
                getColor: d => [255, 140, 0],
                getRadius: d => 5
            })
        ];

        return (
            <DeckGL
                initialViewState={initialViewState}
                controller={true}
                layers={layers}
            >
                <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
            </DeckGL>
        );
    }
}

export default App;
