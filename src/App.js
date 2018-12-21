import React, { Component } from "react";
import "./App.css";
import DeckGL, { IconLayer } from "deck.gl";
import { StaticMap } from "react-map-gl";
import * as d3 from "d3";

import Airplane from "./airplane-icon.jpg";
import destinationPoint from "./destinationPoint";

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
    state = {
        airplanes: []
    };
    currentFrame = null;
    timer = null;
    fetchEverySeconds = 10;
    framesPerFetch = this.fetchEverySeconds * 30; // 60fps, 10 second intervals

    componentDidMount() {
        this.fetchData();
    }

    fetchData = () => {
        d3.json("https://opensky-network.org/api/states/all").then(
            ({ states }) =>
                this.setState(
                    {
                        // from https://opensky-network.org/apidoc/rest.html#response
                        airplanes: states.map(d => ({
                            callsign: d[1],
                            longitude: d[5],
                            latitude: d[6],
                            velocity: d[9],
                            altitude: d[13],
                            origin_country: d[2],
                            true_track: -d[10],
                            interpolatePos: d3.geoInterpolate(
                                [d[5], d[6]],
                                destinationPoint(
                                    d[5],
                                    d[6],
                                    d[9] * this.fetchEverySeconds,
                                    d[10]
                                )
                            )
                        }))
                    },
                    () => {
                        this.startAnimation();
                        setTimeout(
                            this.fetchData,
                            this.fetchEverySeconds * 1000
                        );
                    }
                )
        );
    };

    startAnimation = () => {
        if (this.timer) {
            this.timer.stop();
        }
        this.currentFrame = 0;
        this.timer = d3.timer(this.animationFrame);
    };

    animationFrame = () => {
        let { airplanes } = this.state;
        airplanes = airplanes.map(d => {
            const [longitude, latitude] = d.interpolatePos(
                this.currentFrame / this.framesPerFetch
            );
            return {
                ...d,
                longitude,
                latitude
            };
        });
        this.currentFrame += 1;
        this.setState({ airplanes });
    };

    render() {
        const layers = [
            new IconLayer({
                id: "airplanes",
                data: this.state.airplanes,
                pickable: false,
                iconAtlas: Airplane,
                iconMapping: {
                    airplane: {
                        x: 0,
                        y: 0,
                        width: 512,
                        height: 512
                    }
                },
                sizeScale: 20,
                getPosition: d => [d.longitude, d.latitude],
                getIcon: d => "airplane",
                getAngle: d => 45 + (d.true_track * 180) / Math.PI
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
