import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, Response, Threshold, User } from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { Clause, Expression, MonitorPoint, Rule } from "../../../../core/rule/rule.js";
import { BaseTest } from "./BaseTest.js";

import assert from "assert";
import { AttackAnalysisEngine, EventAnalysisEngine } from "../../../../core/analysis/analysis.js";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";

class SimpleAggregateEventAnalysisEngineTest extends BaseTest {

	private static bob = new User("bob");

	private static detectionPoints: DetectionPoint[] | null = null;

	private static detectionSystems1: string[] = [];

	private static detectionSystem1 = new DetectionSystem("localhostme");

	private static criteria = new Map<string, SearchCriteria>();

	private static rules: Rule[] | null = null;

	private static time: Date;

	private static SLEEP_AMOUNT: number = 10;


	private static generateRules(): Rule[] {
		const configuredRules: Rule[] = [];
		// intervals
		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);

		// detection points
		const point1 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, minutes5)));
		point1.setGuid("00000000-0000-0000-0000-000000000000");

		// clauses
		const points1: DetectionPoint[] = [];
		points1.push(point1);

		const clause1 = new Clause(points1);

		// responses
		const responses: Response[] = SimpleAggregateEventAnalysisEngineTest.generateResponses();

		// rule 1: DP1
		const clauses1: Clause[] = [];
		clauses1.push(clause1);

		const expression1 = new Expression(minutes5, clauses1);

		const expressions1: Expression[] = [];
		expressions1.push(expression1);

		configuredRules.push(new Rule("00000000-0000-0000-0000-000000000011", minutes5, expressions1, responses, "Rule 1"));

		return configuredRules;
	}

	private static generateDetectionPoints(): DetectionPoint[] {
		const detectionPoints: DetectionPoint[] = [];

		// dp1: 3 events in 5 minutes
		const detectionPoint1 = new DetectionPoint();

		detectionPoint1.setCategory(Category.INPUT_VALIDATION);
		detectionPoint1.setLabel("IE1");
		detectionPoint1.setThreshold(new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES)));
		detectionPoint1.setResponses(SimpleAggregateEventAnalysisEngineTest.generateResponses());

		detectionPoints.push(detectionPoint1);

		return detectionPoints;
	}

	private static generateResponses(): Response[] {
		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);

		const log = new Response();
		log.setAction("log");

		const logout = new Response();
		logout.setAction("logout");

		const disableUser = new Response();
		disableUser.setAction("disableUser");

		const disableComponentForSpecificUser5 = new Response();
		disableComponentForSpecificUser5.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser5.setInterval(minutes5);

		const disableComponentForAllUsers5 = new Response();
		disableComponentForAllUsers5.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers5.setInterval(minutes5);

		const responses: Response[] = [];
		responses.push(log);
		responses.push(logout);
		responses.push(disableUser);
		responses.push(disableComponentForSpecificUser5);
		responses.push(disableComponentForAllUsers5);

		return responses;
	}

	static {
		// instantiate member variables

		SimpleAggregateEventAnalysisEngineTest.detectionSystems1.push(SimpleAggregateEventAnalysisEngineTest.detectionSystem1.getDetectionSystemId());

		SimpleAggregateEventAnalysisEngineTest.detectionPoints = SimpleAggregateEventAnalysisEngineTest.generateDetectionPoints();

		SimpleAggregateEventAnalysisEngineTest.rules = SimpleAggregateEventAnalysisEngineTest.generateRules();

		SimpleAggregateEventAnalysisEngineTest.criteria.set("all", new SearchCriteria().setDetectionSystemIds(SimpleAggregateEventAnalysisEngineTest.detectionSystems1));

		SimpleAggregateEventAnalysisEngineTest.criteria.set("dp1", new SearchCriteria().
				setDetectionPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1")).
				setDetectionSystemIds(SimpleAggregateEventAnalysisEngineTest.detectionSystems1));


		SimpleAggregateEventAnalysisEngineTest.criteria.set("rule1", new SearchCriteria().
				setRule(SimpleAggregateEventAnalysisEngineTest.rules![0]).
				setDetectionSystemIds(SimpleAggregateEventAnalysisEngineTest.detectionSystems1));

		SimpleAggregateEventAnalysisEngineTest.time = new Date(Date.now() + 2 * 60 * 1000);
	}

	protected override initializeTest(): void {
		// const rulesEngine = this.getRulesEngine();

		super.initializeTest();
		
		// clear any existing rules & detection points
	
		//rules are cleared in the super implementation

		const emptyDps: DetectionPoint[] = [];
		this.appSensorServer.getConfiguration()!.setDetectionPoints(emptyDps);
	}

	// @Test
	private async test1_DP1() {
		console.log('--> test1_DP1');
		// add rules/detection points
		const rulesToAdd: Rule[] = [];
		rulesToAdd.push(SimpleAggregateEventAnalysisEngineTest.rules![0]);
		this.appSensorServer.getConfiguration()!.setRules(rulesToAdd);

		// add detection point
		const dpsToAdd: DetectionPoint[] = [];
		dpsToAdd.push(SimpleAggregateEventAnalysisEngineTest.detectionPoints![0]);
		this.appSensorServer.getConfiguration()!.setDetectionPoints(dpsToAdd);

		const detectionPoint1 = SimpleAggregateEventAnalysisEngineTest.detectionPoints![0];

		// get events and attacks
		let numEvents = this.appSensorServer.getEventStore()!.findEvents(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length;
		let numDPAttacks = this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length;
		let numRuleAttacks = this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("rule1")!).length;

		// useless sanity check
		assert.equal(numEvents, this.appSensorServer.getEventStore()!.findEvents(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numDPAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numRuleAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("rule1")!).length);


		// 3 events and triggered attack
		await this.addEvents(SimpleAggregateEventAnalysisEngineTest.bob, detectionPoint1, 3);
		numEvents += 3; numDPAttacks++; numRuleAttacks++;

		assert.equal(numEvents, this.appSensorServer.getEventStore()!.findEvents(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numDPAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numRuleAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("rule1")!).length);

		// 1 event and no new attack
		await this.addEvents(SimpleAggregateEventAnalysisEngineTest.bob, detectionPoint1);
		numEvents += 1;

		assert.equal(numEvents, this.appSensorServer.getEventStore()!.findEvents(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numDPAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numRuleAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("rule1")!).length);

		// 2 events and 2 total attack
		await this.addEvents(SimpleAggregateEventAnalysisEngineTest.bob, detectionPoint1, 2);
		numEvents += 2; numDPAttacks++; numRuleAttacks++;

		assert.equal(numEvents, this.appSensorServer.getEventStore()!.findEvents(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numDPAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("dp1")!).length);
		assert.equal(numRuleAttacks, this.appSensorServer.getAttackStore()!.findAttacks(SimpleAggregateEventAnalysisEngineTest.criteria.get("rule1")!).length);

		console.log('<-- test1_DP1');
	}

	protected async addEvents(user: User, detectionPoint: DetectionPoint, count: number = 1) {
		for (let i=0; i < count; i++) {
			this.appSensorClient.getEventManager()!.
				addEvent(new AppSensorEvent(user, detectionPoint, 
										    SimpleAggregateEventAnalysisEngineTest.detectionSystem1, 
											SimpleAggregateEventAnalysisEngineTest.time));

			await super.sleep(SimpleAggregateEventAnalysisEngineTest.SLEEP_AMOUNT);

			SimpleAggregateEventAnalysisEngineTest.time = new Date();
		}
	}


	// private getRulesEngine(): AggregateEventAnalysisEngine {
	// 	const engines = this.appSensorServer.getEventAnalysisEngines();

	// 	for (const engine of engines) {
	// 		if (engine instanceof AggregateEventAnalysisEngine){
	// 			return engine as AggregateEventAnalysisEngine;
	// 		}
	// 	}

	// 	return null;
	// }

	public static async runTests() {
		console.log();
		console.log('----- Run SimpleAggregateEventAnalysisEngineTest -----');
		const inst = new SimpleAggregateEventAnalysisEngineTest();
		inst.initializeTest();
		await inst.test1_DP1();
	}
}

export {SimpleAggregateEventAnalysisEngineTest};