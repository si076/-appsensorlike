import { JSONServerConfiguration, JSONServerConfigurationReader } from "../JSONServerConfig.js";
import { ClientApplication, DetectionPoint, Interval, INTERVAL_UNITS, IPAddress, Response, Threshold } from "../../../../core/core.js";
import { Role } from "../../../../core/accesscontrol/accesscontrol.js";
import { GeoLocation } from "../../../../core/geolocation/geolocation.js";
import { CorrelationSet } from "../../../../core/correlation/correlation.js";
import { Clause, Expression, MonitorPoint, Rule } from "../../../../core/rule/rule.js";

import assert from "assert";

class JSONServerConfigurationTest {

    private testConfigurationReadOfAllElements(): void {
        console.log('--> testConfigurationReadOfAllElements');

        const configExpected = new JSONServerConfiguration();

        configExpected.clientApplicationIdentificationHeaderName = "X-Appsensor-Client-Application-Name";
        configExpected.serverHostName = "localhost";
        configExpected.serverPort = 8080;
        configExpected.serverSocketTimeout = 10;
        configExpected.clientApplications = [
            new ClientApplication("myclientapp1", 
                                  [Role.ADD_EVENT,
                                   Role.ADD_ATTACK,
                                   Role.GET_RESPONSES,
                                   Role.EXECUTE_REPORT]),
            new ClientApplication("myclientapp2", 
                                   [Role.GET_RESPONSES,
                                    Role.EXECUTE_REPORT]).setIpAddress(
                                    new IPAddress("1.1.1.1", new GeoLocation(-26.3811, 27.8376)))
        ];
        configExpected.correlationSets = [
            new CorrelationSet(["server1",
                                "server3"]),
            new CorrelationSet(["server2",
                                "server4"])
        ];
        configExpected.detectionPoints.clients = [
            {
                clientName: "client1",
                detectionPoints: [
                    new DetectionPoint("Request", "RE3", 
                                       new Threshold(13, new Interval(6, INTERVAL_UNITS.MINUTES)),
                                       [new Response(undefined, "log"),
                                        new Response(undefined, "logout"),
                                        new Response(undefined, "disableUser"),
                                        new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                     new Interval(33, INTERVAL_UNITS.MINUTES)),
                                        new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                     new Interval(13, INTERVAL_UNITS.MINUTES)),
                                       ]),
                    new DetectionPoint("Request", "RE4", 
                                       new Threshold(14, new Interval(7, INTERVAL_UNITS.MINUTES)),
                                       [new Response(undefined, "log"),
                                        new Response(undefined, "logout"),
                                        new Response(undefined, "disableUser"),
                                        new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                     new Interval(34, INTERVAL_UNITS.MINUTES)),
                                        new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                     new Interval(14, INTERVAL_UNITS.MINUTES)),
                                       ])
                ]
            },
            {
                clientName: "client2",
                detectionPoints: [
                    new DetectionPoint("Request", "RE5", 
                                       new Threshold(15, new Interval(8, INTERVAL_UNITS.MINUTES)),
                                       [new Response(undefined, "log"),
                                        new Response(undefined, "logout"),
                                        new Response(undefined, "disableUser"),
                                        new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                     new Interval(35, INTERVAL_UNITS.MINUTES)),
                                        new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                     new Interval(15, INTERVAL_UNITS.MINUTES)),
                                       ]),
                    new DetectionPoint("Request", "RE7", 
                                       new Threshold(2, new Interval(8, INTERVAL_UNITS.MINUTES)),
                                       [new Response(undefined, "log"),
                                       ]),
                    new DetectionPoint("Request", "RE7", 
                                       new Threshold(5, new Interval(5, INTERVAL_UNITS.MINUTES)),
                                       [new Response(undefined, "logout"),
                                       ]),
                    new DetectionPoint("Input Validation", "IE15", 
                                       new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES)),
                                       [new Response(undefined, "log"),
                                        new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                     new Interval(20, INTERVAL_UNITS.SECONDS)),
                                        new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                     new Interval(45, INTERVAL_UNITS.SECONDS)),
                                       ])
                ]
            }
        ];
        configExpected.detectionPoints.detectionPoints = [
            new DetectionPoint("Input Validation", "IE1", 
                                new Threshold(11, new Interval(4, INTERVAL_UNITS.MINUTES)),
                                [new Response(undefined, "log"),
                                new Response(undefined, "logout"),
                                new Response(undefined, "disableUser"),
                                new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                            new Interval(31, INTERVAL_UNITS.MINUTES)),
                                new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                            new Interval(11, INTERVAL_UNITS.MINUTES)),
                                ]),
            new DetectionPoint("Input Validation", "IE2", 
                                new Threshold(12, new Interval(5, INTERVAL_UNITS.MINUTES)),
                                [new Response(undefined, "log"),
                                new Response(undefined, "logout"),
                                new Response(undefined, "disableUser"),
                                new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                            new Interval(32, INTERVAL_UNITS.MINUTES)),
                                new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                            new Interval(12, INTERVAL_UNITS.MINUTES)),
                                ])

        ];
        configExpected.rules = [
            new Rule("00000000-0000-0000-0000-000000000001",
                      new Interval(10, INTERVAL_UNITS.MINUTES),
                      [new Expression(new Interval(5, INTERVAL_UNITS.MINUTES),
                                      [new Clause([new MonitorPoint(new DetectionPoint("Input Validation", "IE1", 
                                                                        new Threshold(11, new Interval(4, INTERVAL_UNITS.MINUTES)),
                                                                        [new Response(undefined, "log"),
                                                                         new Response(undefined, "logout"),
                                                                         new Response(undefined, "disableUser"),
                                                                         new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                                                      new Interval(31, INTERVAL_UNITS.MINUTES)),
                                                                         new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                                                      new Interval(11, INTERVAL_UNITS.MINUTES)),
                                                                        ]),
                                                                        "00000000-0001-00e1-00c1-000000000001"),
                                                    new MonitorPoint(new DetectionPoint("Input Validation", "IE2", 
                                                                        new Threshold(12, new Interval(5, INTERVAL_UNITS.MINUTES)),
                                                                        [new Response(undefined, "log"),
                                                                         new Response(undefined, "logout"),
                                                                         new Response(undefined, "disableUser"),
                                                                         new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                                                      new Interval(32, INTERVAL_UNITS.MINUTES)),
                                                                         new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                                                      new Interval(12, INTERVAL_UNITS.MINUTES)),
                                                                        ]),
                                                                        "00000000-0001-00e1-00c1-000000000002"),                    
                                                  ]),
                                        new Clause([new MonitorPoint(new DetectionPoint("Request", "RE7", 
                                                                        new Threshold(2, new Interval(8, INTERVAL_UNITS.MINUTES)),
                                                                        [new Response(undefined, "log"),
                                                                        ]),
                                                                        "00000000-0001-00e1-00c2-000000000001")
                                                  ])
                                      ]),
                       new Expression(null,
                                      [new Clause([new MonitorPoint(new DetectionPoint("Request", "RE5", 
                                                                        new Threshold(15, new Interval(8, INTERVAL_UNITS.MINUTES)),
                                                                        [new Response(undefined, "log"),
                                                                         new Response(undefined, "logout"),
                                                                         new Response(undefined, "disableUser"),
                                                                         new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                                                      new Interval(35, INTERVAL_UNITS.MINUTES)),
                                                                         new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                                                      new Interval(15, INTERVAL_UNITS.MINUTES)),
                                                                        ]),
                                                                        "00000000-0001-00e2-00c1-000000000001")
                                                   ])
                                      ]) 
                      ],
                      [new Response(undefined, "log"),
                       new Response(undefined, "logout"),
                       new Response(undefined, "disableUser"),
                       new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                new Interval(32, INTERVAL_UNITS.MINUTES)),
                       new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                new Interval(12, INTERVAL_UNITS.MINUTES)),
                      ],
                      "Rule1"),
            new Rule("00000000-0000-0000-0000-000000000002",
                      new Interval(3, INTERVAL_UNITS.SECONDS),
                      [new Expression(new Interval(2, INTERVAL_UNITS.SECONDS),
                                      [new Clause([new MonitorPoint(new DetectionPoint("Input Validation", "IE15", 
                                                                        new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES)),
                                                                        [new Response(undefined, "log"),
                                                                         new Response(undefined, "disableComponentForSpecificUser", undefined, undefined, 
                                                                                      new Interval(20, INTERVAL_UNITS.SECONDS)),
                                                                         new Response(undefined, "disableComponentForAllUsers", undefined, undefined, 
                                                                                      new Interval(45, INTERVAL_UNITS.SECONDS)),
                                                                        ]),
                                                                        "00000000-0002-00e1-00c1-000000000001")
                                                  ]),
                                      ])
                      ],
                      [new Response(undefined, "logout"),
                      ],
                      "Rule2")
        ];
        const customDetectionPoints = new Map<string, DetectionPoint[]>();
        if (configExpected.detectionPoints.clients) {
            configExpected.detectionPoints.clients.forEach(el => {

                customDetectionPoints.set(el.clientName, el.detectionPoints);
            });

            configExpected.setCustomDetectionPoints(customDetectionPoints);
        }


        const configActual = new JSONServerConfigurationReader().read('./configuration-modes/appsensor-configuration-json/server/tests/appsensor-server-config.json');

        assert.deepStrictEqual(configActual, configExpected);

        console.log('<-- testConfigurationReadOfAllElements ');
    }

    public static runTests() {
        console.log('');
        console.log('----- JSONServerConfigurationTest -----');
        new JSONServerConfigurationTest().testConfigurationReadOfAllElements();
    }
}

export {JSONServerConfigurationTest};