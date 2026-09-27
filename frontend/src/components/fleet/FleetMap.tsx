"use client";

import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import type { Driver } from "./type";

type FleetMapProps = {
    drivers: Driver[];
    selectedDriverId: string | null;
};

export default function FleetMap({
    drivers,
    selectedDriverId,
}: FleetMapProps) {

    const mapElement = useRef<HTMLDivElement>(null);

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

            for (const driver of drivers) {
                //adding driver's route only when at least 2 points exist.
                if (driver.route.length > 1) {
                    source.add(
                        new atlas.data.Feature(
                            new atlas.data.LineString(driver.route),
                            {
                                driverId: driver.id,
                                type: "route",
                            },
                        ),
                    );
                }

                //adding driver's current location
                source.add(
                    new atlas.data.Feature(new atlas.data.Point(driver.location), {
                        driverId: driver.id,
                        driverName: driver.name,
                        type: "driver",
                    }),
                );
            }

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
                }),
            );

            //fitting the map around all drivers when possible
            const coordinates = drivers.flatMap((driver) => [
                driver.location,
                ...driver.route,
            ]);

            if (coordinates.length > 0) {
                map.setCamera({
                    bounds: atlas.data.BoundingBox.fromPositions(coordinates),
                    padding: 50,
                });
            }
        });

        //getting rid of the map when component is removed or refreshed
        return () => {
            map.dispose();
        };

    }, [drivers, selectedDriverId]);

    return <div ref={mapElement} className="h-full w-full" />;

}