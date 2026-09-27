"use client";

import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import type { Driver } from "./type";

type FleetMapProps = {
    drivers: Driver[];
    selectedDriverId: string | null;
};

const routeId = (driverId: string) => `route-${driverId}`;
const markerId = (driverId: string) => `marker-${driverId}`;

export default function FleetMap({
    drivers,
    selectedDriverId,
}: FleetMapProps) {

    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<atlas.Map | null>(null);
    const sourceRef = useRef<atlas.source.DataSource | null>(null);
    const knownDriverIdsRef = useRef<Set<string>>(new Set()); //tracking who we have fit the camera to

    useEffect(() => {

        if (!mapElement.current) {
            return;
        }

        const subscriptionKey = process.env.NEXT_PUBLIC_AZURE_MAPS_SUBSCRIPTION_KEY;

        if (!subscriptionKey) {
            console.error("Azure Maps subscription key is missing.");
            return;
        }

        //creating azure maps instance
        const map = new atlas.Map(mapElement.current, {

            center: [28.2293, -25.7479],
            zoom: 11,
            view: "Auto",
            style: "road",

            authOptions: {
                authType: atlas.AuthenticationType.subscriptionKey,
                subscriptionKey,
            },

        });

        map.events.add("ready", () => {
            //dataSource stores all driver routes and markers
            const source = new atlas.source.DataSource();

            map.sources.add(source);

            // for (const driver of drivers) {
            //     //adding driver's route only when at least 2 points exist.
            //     if (driver.route && driver.route.length > 1) {
            //         source.add(
            //             new atlas.data.Feature(
            //                 new atlas.data.LineString(driver.route),
            //                 {
            //                     driverId: driver.id,
            //                     type: "route",
            //                 },
            //             ),
            //         );
            //     }

            //     //adding driver's current location
            //     if(driver.location){
            //         source.add(
            //             new atlas.data.Feature(new atlas.data.Point(driver.location), {
            //                 driverId: driver.id,
            //                 driverName: driver.name,
            //                 type: "driver",
            //             }),
            //         );
            //     }
            // }

            //selected driver's route is thicker, brighter and fully opaque
            map.layers.add(
                new atlas.layer.LineLayer(source, "driver-routes", {
                    strokeColor: [
                        "case",
                        ["==", ["get", "driverId"], selectedDriverId ?? ""],
                        "#006EFF",
                        "#38A9E8",
                    ],
                    strokeWidth: [
                        "case",
                        ["==", ["get", "driverId"], selectedDriverId ?? ""],
                        7,
                        3,
                    ],
                    strokeOpacity: [
                        "case",
                        ["==", ["get", "driverId"], selectedDriverId ?? ""],
                        1,
                        0.45,
                    ],
                    filter: ["==", ["get", "type"], "route"],
                }),
            );

            //driver markers and labels
            map.layers.add(
                new atlas.layer.SymbolLayer(source, "driver-markers", {
                    iconOptions: {
                        image: "pin-round-blue",
                        allowOverlap: true,
                    },
                    textOptions: {
                        textField: ["get", "driverName"],
                        color: "#111827",
                        size: 12,
                        offset: [0, 1.5],
                    },
                    filter: ["==", ["get", "type"], "driver"],
                }),
            );

            sourceRef.current = source;
            mapRef.current = map;

            syncSource(source, drivers);
            // fitCamera(map, drivers);
            // knownDriverIdsRef.current = new Set(drivers.map((d) => d.id));

            //fitting the map around all drivers when possible
            // const coordinates = drivers.flatMap((driver) => [
            //     ...(driver.location? [driver.location] : []),
            //     ...(driver.route ?? []),
            // ]);

            // if (coordinates.length > 0) {
            //     map.setCamera({
            //         bounds: atlas.data.BoundingBox.fromPositions(coordinates),
            //         padding: 50,
            //     });
            // }
        });

        //getting rid of the map when component is removed or refreshed
        return () => {
            map.dispose();
            mapRef.current = null;
            sourceRef.current = null;
            knownDriverIdsRef.current = new Set();
        };
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    //Patch layer styling when the selectedDriverId changes
    useEffect(() => {
        const map = mapRef.current;
        if(!map) return;

        const routeLayer = map.layers.getLayerById("driver-routes") as atlas.layer.LineLayer | undefined;
        if(routeLayer){
            routeLayer.setOptions({
                strokeColor: [
                    "case",
                    ["==", ["get", "driverId"], selectedDriverId ?? ""],
                    "#006EFF",
                    "#38A9E8",
                ],
                strokeWidth: [
                    "case",
                    ["==", ["get", "driverId"], selectedDriverId ?? ""],
                    7,
                    3,
                ],
                strokeOpacity: [
                    "case",
                    ["==", ["get", "driverId"], selectedDriverId ?? ""],
                    1,
                    0.45,
                ],
            });
        }

    }, [selectedDriverId]);

    //Patch driver data incrementally when drivers change
    useEffect(()=> {
        const source = sourceRef.current;
        const map = mapRef.current;
        if(!source || !map) return;

        syncSource(source, drivers);

        const currentIds = new Set(drivers.map((d)=> d.id));
        const isFirstLoad = knownDriverIdsRef.current.size === 0;
        const hasNewDriver = drivers.some((d)=> !knownDriverIdsRef.current.has(d.id));

        if(isFirstLoad || hasNewDriver) {
            fitCamera(map, drivers);
        }

        knownDriverIdsRef.current = currentIds;
    }, [drivers]);

    return <div ref={mapElement} className="h-full w-full" />;

}

//Patch route/marker shapes in place
function syncSource(source: atlas.source.DataSource, drivers: Driver[]){
    const seenDriverIds = new Set<string>();

    for(const driver of drivers){
        seenDriverIds.add(driver.id);

        const existingRoute = source.getShapeById(routeId(driver.id));

        if(driver.route && driver.route.length > 1){
            if(existingRoute){
                existingRoute.setCoordinates(driver.route);
            }else {
                source.add(
                    new atlas.Shape(
                        new atlas.data.LineString(driver.route), 
                        routeId(driver.id),
                        {
                            driverId: driver.id,
                            type: "route",
                        }
                    )
                );
            }

        }else if (existingRoute){
            source.remove(existingRoute);
        }

        const existingMarker = source.getShapeById(markerId(driver.id));

        if(driver.location){
            if(existingMarker){
                existingMarker.setCoordinates(driver.location);
                existingMarker.setProperties({
                    driverId: driver.id,
                    driverName: driver.name,
                    type: "driver",
                });
            } else {
                source.add(
                    new atlas.Shape(new atlas.data.Point(driver.location), markerId(driver.id), {
                        driver: driver.id,
                        driverName: driver.name,
                        type: "driver",
                    })
                );
            }

        } else if(existingMarker) {
            source.remove(existingMarker);
        }
    }

    for(const shape of source.getShapes()){

        const driverId = shape.getProperties()?.driverId;

        if(driverId && !seenDriverIds.has(driverId)) {
            source.remove(shape);
        }
    }
}

//Fit camera to all drivers
function fitCamera(map: atlas.Map, drivers: Driver[]){
    const coordinates = drivers.flatMap((driver) => [
        ...(driver.location ? [driver.location] : []),
        ...(driver.route ?? []),
    ]);

    if(coordinates.length > 0) {
        map.setCamera({
            bounds: atlas.data.BoundingBox.fromPositions(coordinates),
            padding: 50,
        });
    }
}

