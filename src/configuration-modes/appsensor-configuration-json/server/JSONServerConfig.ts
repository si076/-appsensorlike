import fs from 'fs';

import { ServerConfiguration, ServerConfigurationReader } from "../../../core/configuration/server/server_configuration.js";
import { Clause, Expression, MonitorPoint, Rule } from '../../../core/rule/rule.js';
import { ClientApplication, DetectionPoint, DetectionSystem, Interval, IPAddress, KeyValuePair, Response, Threshold, User } from '../../../core/core.js';
import { CorrelationSet } from '../../../core/correlation/correlation.js';
import { GeoLocation } from '../../../core/geolocation/geolocation.js';
import { JSONConfig } from '../JSONConfig.js';


class JSONServerConfiguration extends ServerConfiguration {
}

class JSONServerConfigurationReader extends JSONConfig implements ServerConfigurationReader {

    private configFile: string = 'appsensor-server-config.json';
    private configSchemaFile: string = 'appsensor-server-config_schema.json'; 

    private static configPrototypesSample: JSONServerConfiguration;

    static {
        JSONServerConfigurationReader.configPrototypesSample = new JSONServerConfiguration();

        const interval = new Interval();

        const ipAddress = new IPAddress();
        ipAddress.setGeoLocation(new GeoLocation(0, 0));

        const user = new User();
        user.setIPAddress(ipAddress);

        const response = new Response();
        response.setInterval(interval);
        response.setDetectionSystem(new DetectionSystem('', ipAddress));
        response.setMetadata([new KeyValuePair()]);

        const threshold = new Threshold();
        threshold.setInterval(interval);

        const detPoint = new DetectionPoint("something", "something");
        detPoint.setThreshold(threshold);
        detPoint.setResponses([response]);

        const clause = new Clause();
        clause.setMonitorPoints([detPoint]);

        const expre = new Expression();
        expre.setClauses([clause]);
        expre.setWindow(interval);

        const rule: Rule = new Rule();
        rule.setWindow(interval);
        rule.setExpressions([expre]);
        rule.setResponses([response]);

        JSONServerConfigurationReader.configPrototypesSample.rules = [rule];


        JSONServerConfigurationReader.configPrototypesSample.detectionPoints.clients = [
            {
                clientName: "client",
                detectionPoints: [detPoint]
            }
        ];
        JSONServerConfigurationReader.configPrototypesSample.detectionPoints.detectionPoints = [detPoint];

        const correlSet = new CorrelationSet();
        JSONServerConfigurationReader.configPrototypesSample.correlationSets = [correlSet];

        const clientAppl = new ClientApplication();
        clientAppl.setIpAddress(ipAddress);

        JSONServerConfigurationReader.configPrototypesSample.clientApplications = [clientAppl];
    }

    read(configurationLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ServerConfiguration | null {
        let config: ServerConfiguration | null = null;


        if (configurationLocation === '') {
            configurationLocation = this.configFile;
            // throw new Error('JSONServerConfigurationReader: configurationLocation cannot be null!');
        };

        if (validatorLocation === '') {
            validatorLocation = this.configSchemaFile;
            // throw new Error('JSONServerConfigurationReader: validatorLocation cannot be null!');
        };

        try {
            // config = JSON.parse(fs.readFileSync(configurationLocation, 'utf8'), (key, value) => {
            //     console.log(key + ' -> ' + value);
            // });
            config = JSON.parse(fs.readFileSync(configurationLocation, 'utf8'));
            if (config) {
                this.setPrototypeInDepth(config, JSONServerConfigurationReader.configPrototypesSample);

                this.customPoints(config);

                //set detection points' label to be as id 
                //for more details about that change in the original java code 
                //see https://github.com/jtmelton/appsensor/issues/18
                this.adjustDetectionPoints(config.getDetectionPoints());

                this.adjustRulesMonitorPoints(config);

            }
        } catch (error) {
            if (!reload) {
                throw error;
            } else {
                console.error(error);
            }
        }

        // console.log(JSON.stringify(config, null, 2));

        if (config && validatorLocation !== null) {
            // console.log('Validating config...');

            const valid = this.validateConfig(config, validatorLocation, reload);
            if (!valid) {
                //There is(are) validation error(s) reported by validateConfig
                config = null;
            }
        }
        
        return config;
    }

    private customPoints(config: ServerConfiguration) {
        const customDetectionPoints = new Map<string, DetectionPoint[]>();

        if (config.detectionPoints.clients) {
            config.detectionPoints.clients.forEach(el => {

                //set detection points' label to be as id 
                //for more details about that change in the original java code 
                //see https://github.com/jtmelton/appsensor/issues/18
                this.adjustDetectionPoints(el.detectionPoints);

                customDetectionPoints.set(el.clientName, el.detectionPoints);
            });

            config.setCustomDetectionPoints(customDetectionPoints);
        }
    }

    private adjustRulesMonitorPoints(config: ServerConfiguration) {
        if (config.rules) {
            config.rules.forEach(rl => {
                rl.getExpressions().forEach(ex => {
                    ex.getClauses().forEach(cl => {
                        const monitPoints: MonitorPoint[] = [];

                        cl.getMonitorPoints().forEach(dp => {

                            //set detection point's label to be as id 
                            //for more details about that change in the original java code 
                            //see https://github.com/jtmelton/appsensor/issues/18
                            dp.setLabel(dp.getId());

                            monitPoints.push(new MonitorPoint(dp));
                        });

                        cl.setMonitorPoints(monitPoints);
                    });
                })
            });
        }
    }

    adjustDetectionPoints(detPoints: DetectionPoint[]) {
        if (detPoints) {
            detPoints.forEach(el => {
                el.setLabel(el.getId());
            });
        }
    }

    public static test() {
        const inst = new JSONServerConfigurationReader();
        const config: ServerConfiguration | null = inst.read();

        console.log(JSON.stringify(config!.getDetectionPoints()[0].getThreshold(), null, 2));
    }

}

export {JSONServerConfiguration, JSONServerConfigurationReader};