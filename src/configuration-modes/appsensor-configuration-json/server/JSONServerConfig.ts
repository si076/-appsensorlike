import { ServerConfiguration, ServerConfigurationReader } from "../../../core/configuration/server/server_configuration.js";
import { MonitorPoint } from '../../../core/rule/rule.js';
import { ClientApplication, DetectionPoint } from '../../../core/core.js';
import { CorrelationSet } from '../../../core/correlation/correlation.js';
import { JSONConfigReadValidate, Utils } from '../../../utils/Utils.js';

import fs from 'fs';

class JSONServerConfiguration extends ServerConfiguration {
}

class JSONServerConfigurationReader extends JSONConfigReadValidate implements ServerConfigurationReader {

    public static configPrototypesSample: JSONServerConfiguration;

    public static DEFAULT_CONFIG_FILE        = 'appsensor-server-config.json';
    public static DEFAULT_CONFIG_SCHEMA_FILE = 'appsensor-server-config_schema.json';


    static {
        JSONServerConfigurationReader.configPrototypesSample = new JSONServerConfiguration();
        JSONServerConfigurationReader.configPrototypesSample.rules = [Utils.ruleSample];
        JSONServerConfigurationReader.configPrototypesSample.detectionPoints.clients = [
            {
                clientName: "client",
                detectionPoints: [Utils.detectionPointSample]
            }
        ];
        JSONServerConfigurationReader.configPrototypesSample.detectionPoints.detectionPoints = [Utils.detectionPointSample];

        const correlSet = new CorrelationSet();
        JSONServerConfigurationReader.configPrototypesSample.correlationSets = [correlSet];

        const clientAppl = new ClientApplication();
        clientAppl.setIPAddress(Utils.ipAddressSample);

        JSONServerConfigurationReader.configPrototypesSample.clientApplications = [clientAppl];
    }

    constructor() {
        super(JSONServerConfigurationReader.DEFAULT_CONFIG_FILE, 
              JSONServerConfigurationReader.DEFAULT_CONFIG_SCHEMA_FILE);
    }

    public override read(configurationLocation: string = '', 
                         validatorLocation: string | null = '', 
                         reload: boolean = false): ServerConfiguration | null {
        let config: ServerConfiguration | null = null;

        config = super.read(configurationLocation, validatorLocation, reload);

        this.adjustConfig(config, configurationLocation);

        // console.log(JSON.stringify(config, null, 2));
        
        return config;
    }

    public override readFromString(configAsString: string, validatorLocation?: string | null) {
        let config: ServerConfiguration | null = null;

        config = super.readFromString(configAsString, validatorLocation);

        this.adjustConfig(config);

        // console.log(JSON.stringify(config, null, 2));
        
        return config;
    }

    protected adjustConfig(config: ServerConfiguration | null, configurationLocation: string | null = null) {
        if (config) {
            Utils.setPrototypeInDepth(config, JSONServerConfigurationReader.configPrototypesSample);
    
            if (Utils.isIValidateInitialize(config)) {
                config.checkValidInitialize();
            }
    

            //set detection points' label to be as id 
            //for more details about that change in the original java code 
            //see https://github.com/jtmelton/appsensor/issues/18
            //
            if (config.detectionPoints.clients) {
                config.detectionPoints.clients.forEach(el => {
                    this.adjustDetectionPoints(el.detectionPoints);
                });
            }
            //
            this.adjustDetectionPoints(config.getDetectionPoints());
            //
            this.adjustRulesMonitorPoints(config);


            this.customPoints(config);


            if (configurationLocation !== null) { //to distinguish when the config has been loaded from a file
                const configLocation = this.getConfigLocation(configurationLocation);

                config.setConfigurationFile(fs.realpathSync(configLocation));
            }
        }
    }

     private customPoints(config: ServerConfiguration) {
        if (config.detectionPoints.clients) {
            config.detectionPoints.clients.forEach(el => {
                config.customDetectionPoints.set(el.clientName, el.detectionPoints);
            });
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

	/**
	 * When saving to a json config file or transferring config as a JSON, 
	 * do some preparatory work.
	 */
     public prepareToJSON(config: ServerConfiguration): ServerConfiguration {
		//mind to reflect customDetectionPoints map to detectionPoints.clients
		//as they carry client/custom detection points information 
		//when saving to a json config file or transferring config as a JSON string
		if (config.customDetectionPoints.size > 0) {
			config.detectionPoints.clients = [];
			const entries = config.customDetectionPoints.entries();
			for (const entry of entries) {
				config.detectionPoints.clients.push({clientName: entry[0], detectionPoints: entry[1]});
			}
		}

		return config;
	}


    public static test() {
        const inst = new JSONServerConfigurationReader();
        const config: ServerConfiguration | null = inst.read();

        console.log(JSON.stringify(config!.getDetectionPoints()[0].getThreshold(), null, 2));
    }

}

export {JSONServerConfiguration, JSONServerConfigurationReader};