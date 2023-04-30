import { BaseTests } from "./BaseTests.js";
import { AppSensorEvent, AppSensorServer, KeyValuePair } from "../../../core/core.js";
import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from "../appsensor-storage-mysql.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";

import assert from "assert";
import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";
import { ServerConfiguration } from "../../../core/configuration/server/server_configuration.js";
import { DOP } from "../DOP.js";


class MySQLStorageTests extends BaseTests {

    private async storeObjects() {
        console.log('--> storeObjects');

        const earliest = new Date();

        const event1 = new AppSensorEvent(BaseTests.user, BaseTests.point1, BaseTests.detectionSystem, new Date());
        event1.setResource(BaseTests.resource);
        event1.setMetadata(BaseTests.metadata);

		const event2 = new AppSensorEvent(BaseTests.user, BaseTests.point1, BaseTests.detectionSystem, new Date());
        event2.setResource(BaseTests.resource);
        event2.setMetadata(BaseTests.metadata);

		const event3 = new AppSensorEvent(BaseTests.user, BaseTests.point2, BaseTests.detectionSystem, new Date());
        event3.setResource(BaseTests.resource);
        event3.setMetadata(BaseTests.metadata);


		const event4 = new AppSensorEvent(BaseTests.user, BaseTests.point3, BaseTests.detectionSystem, new Date());
		const keyValue3 = new KeyValuePair("key3", "value3");
		const metadata4 = BaseTests.metadata.slice();
		metadata4.push(keyValue3);

        event4.setResource(BaseTests.resource);
        event4.setMetadata(metadata4);
	
        const event5 = new AppSensorEvent(BaseTests.user, BaseTests.point1, BaseTests.detectionSystem, new Date());
        event5.setResource(BaseTests.resource);
        event5.setMetadata(BaseTests.metadata);

        
        this.appSensorServer.getConfiguration()!.setDetectionPoints([BaseTests.point1, BaseTests.point2, BaseTests.point3]);

        //feed event storage 
        await this.appSensorServer.getEventStore()!.addEvent(event1);
        await this.appSensorServer.getEventStore()!.addEvent(event2);
        await this.appSensorServer.getEventStore()!.addEvent(event3);
        await this.appSensorServer.getEventStore()!.addEvent(event4);
        await this.appSensorServer.getEventStore()!.addEvent(event5);
        

        const criteria = new SearchCriteria();

        const foundEvents = await this.appSensorServer.getEventStore()!.findEvents(criteria);
        assert.equal(foundEvents.length, 5);

        criteria.setUser(BaseTests.user);
        criteria.setDetectionSystemIds([BaseTests.detectionSystem.getDetectionSystemId()]);
        criteria.setDetectionPoint(BaseTests.point1);
        criteria.setEarliest(earliest);

        const foundAttacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(foundAttacks.length, 1);

        console.log('<-- storeObjects');
    } 

    public static async runTests() {
        console.log('----- Run MySQLStorageTests -----');
		const inst = new MySQLStorageTests();
        await inst.initializeTest();
		await inst.storeObjects();
    }

}

export {MySQLStorageTests}