import { AggregateEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { EventAnalysisEngine } from "../../../../core/analysis/analysis.js";
import { AppSensorEvent, AppSensorServer, Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, Response, Threshold, User } from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { Clause, Expression, MonitorPoint, Rule } from "../../../../core/rule/rule.js";

import assert from "assert";
import { BaseTest } from "./BaseTest.js";

class AggregEventAnalysisEngIntegTest extends BaseTest {

	private static bob = new User("bob");

	private static detectionPoint1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1");

	private static detectionPoint2 = new DetectionPoint(Category.INPUT_VALIDATION, "IE2");

	private static detectionPoint3 = new DetectionPoint(Category.INPUT_VALIDATION, "IE3");

	private static detectionPoint4 = new DetectionPoint(Category.INPUT_VALIDATION, "IE4");

	private static detectionPoint5 = new DetectionPoint(Category.INPUT_VALIDATION, "IE5");

	private static detectionSystems1: string[] = [];

	private static detectionSystem1 = new DetectionSystem("localhostme");

	private static criteria = new Map<string, SearchCriteria>();

	private static myEngine: AggregateEventAnalysisEngine | null = null;

	private static rules: Rule[] = [];

	protected sleepAmount: number = 10;

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

	private static generateRules(): Rule[] {
		const configuredRules: Rule[] = [];
		// intervals
		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);
		const minutes6 = new Interval(6, INTERVAL_UNITS.MINUTES);
		const minutes10 = new Interval(10, INTERVAL_UNITS.MINUTES);
		const minutes16 = new Interval(16, INTERVAL_UNITS.MINUTES);

		// detection points
		const point1 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, minutes5)));
		point1.setGuid("00000000-0000-0000-0000-000000000000");
		const point2 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE2", new Threshold(12, minutes5)));
		const point3 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE3", new Threshold(13, minutes6)));
		const point4 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE4", new Threshold(4, minutes10)));

		// clauses
		const points1: DetectionPoint[] = [];
		points1.push(point1);

		const points1and2: DetectionPoint[] = [];
		points1and2.push(point1);
		points1and2.push(point2);

		const points2: DetectionPoint[] = [];
		points2.push(point2);

		const points2and3: DetectionPoint[] = [];
		points2and3.push(point2);
		points2and3.push(point3);

		const points1and3: DetectionPoint[] = [];
		points1and3.push(point1);
		points1and3.push(point3);

		const points1and4: DetectionPoint[] = [];
		points1and4.push(point1);
		points1and4.push(point4);

		const clause1 = new Clause(points1);
		const clause1and2 = new Clause(points1and2);
		const clause2 = new Clause(points2);
		const clause2and3 = new Clause(points2and3);
		const clause1and3 = new Clause(points1and3);
		const clause1and4 = new Clause(points1and4);

		// responses
		const responses: Response[] = AggregEventAnalysisEngIntegTest.generateResponses();

		//rule 1: DP1
		const clauses1: Clause[] = [];
		clauses1.push(clause1);

		const expression1 = new Expression(minutes5, clauses1);

		const expressions1: Expression[] = [];
		expressions1.push(expression1);

		configuredRules.push(new Rule("00000000-0000-0000-0000-000000000011", minutes16, expressions1, responses, "Rule 1"));

		//rule 2: DP1 AND DP2
		const clauses1and2: Clause[] = [];
		clauses1and2.push(clause1and2);

		const expression1and2 = new Expression(minutes5, clauses1and2);

		const expressions1and2: Expression[] = [];
		expressions1and2.push(expression1and2);

		configuredRules.push(new Rule("Rule 2", minutes5, expressions1and2, responses));

		//rule 3: DP1 OR DP2
		const clauses1or2: Clause[] = [];
		clauses1or2.push(clause1);
		clauses1or2.push(clause2);

		const expression1or2 = new Expression(minutes5, clauses1or2);

		const expressions1or2: Expression[] = [];
		expressions1or2.push(expression1or2);

		configuredRules.push(new Rule("Rule 3", minutes5, expressions1or2, responses));

		//rule4: DP1 OR DP2 AND DP3
		const clauses1or2and3: Clause[] = [];
		clauses1or2and3.push(clause1);
		clauses1or2and3.push(clause2and3);

		const expression1or2and3 = new Expression(minutes5, clauses1or2and3);

		const expressions1or2and3: Expression[] = [];
		expressions1or2and3.push(expression1or2and3);

		configuredRules.push(new Rule("Rule 4", minutes5, expressions1or2and3, responses));

		//rule 5: DP1 THEN DP2
		const clauses2: Clause[] = [];
		clauses2.push(clause2);

		const expression2 = new Expression(minutes6, clauses2);

		const expressions1then2: Expression[] = [];
		expressions1then2.push(expression1);
		expressions1then2.push(expression2);

		configuredRules.push(new Rule("Rule 5", minutes6, expressions1then2, responses));

		//rule 6: DP1 THEN DP2 THEN DP1 OR DP2
		const expressions1then2then1or2: Expression[] = [];
		expressions1then2then1or2.push(expression1);
		expressions1then2then1or2.push(expression2);
		expressions1then2then1or2.push(expression1or2);

		configuredRules.push(new Rule("Rule 6", minutes16, expressions1then2then1or2, responses));

		//rule 7: DP1 AND DP4 OR DP1 AND DP3 THEN DP1
		const clauses1and4or1and3: Clause[] = [];
		clauses1and4or1and3.push(clause1and4);
		clauses1and4or1and3.push(clause1and3);

		const expression1and4or1and3 = new Expression(minutes10, clauses1and4or1and3);
		const expressions1and4or1and3then1: Expression[] = [];
		expressions1and4or1and3then1.push(expression1and4or1and3);
		expressions1and4or1and3then1.push(expression1);

		configuredRules.push(new Rule("Rule 7", minutes16, expressions1and4or1and3then1, responses));

		return configuredRules;
	}

	// @BeforeClass
	static {
		//detectionPoint1.setThreshold(new Threshold(3, new Interval(5, Interval.MINUTES)));

		AggregEventAnalysisEngIntegTest.detectionPoint2.setThreshold(new Threshold(12, new Interval(5, INTERVAL_UNITS.MINUTES)));

		AggregEventAnalysisEngIntegTest.detectionPoint3.setThreshold(new Threshold(13, new Interval(6, INTERVAL_UNITS.MINUTES)));

		AggregEventAnalysisEngIntegTest.detectionSystems1.push(AggregEventAnalysisEngIntegTest.detectionSystem1.getDetectionSystemId());

		AggregEventAnalysisEngIntegTest.criteria.set("all", new SearchCriteria().setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

		AggregEventAnalysisEngIntegTest.criteria.set("dp1", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setDetectionPoint(AggregEventAnalysisEngIntegTest.detectionPoint1).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("dp2", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setDetectionPoint(AggregEventAnalysisEngIntegTest.detectionPoint2).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("dp3", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setDetectionPoint(AggregEventAnalysisEngIntegTest.detectionPoint3).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("dp5", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setDetectionPoint(AggregEventAnalysisEngIntegTest.detectionPoint5).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.rules = AggregEventAnalysisEngIntegTest.generateRules();

		AggregEventAnalysisEngIntegTest.criteria.set("rule1", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setRule(AggregEventAnalysisEngIntegTest.rules[0]).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("rule2", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setRule(AggregEventAnalysisEngIntegTest.rules[1]).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("rule3", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setRule(AggregEventAnalysisEngIntegTest.rules[2]).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("rule4", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setRule(AggregEventAnalysisEngIntegTest.rules[3]).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("rule5", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setRule(AggregEventAnalysisEngIntegTest.rules[4]).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));

        AggregEventAnalysisEngIntegTest.criteria.set("rule6", new SearchCriteria().
				setUser(AggregEventAnalysisEngIntegTest.bob).
				setRule(AggregEventAnalysisEngIntegTest.rules[5]).
				setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1));
	}

	private static loadMockedDetectionPoints(): DetectionPoint[] {
		const configuredDetectionPoints: DetectionPoint[] = [];

		const responses: Response[] = AggregEventAnalysisEngIntegTest.generateResponses();

		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);
		const minutes6 = new Interval(6, INTERVAL_UNITS.MINUTES);

		const events3minutes5 = new Threshold(3, minutes5);
		const events12minutes5 = new Threshold(12, minutes5);
		const events13minutes6 = new Threshold(13, minutes6);

		const point1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1", events3minutes5, responses);
		const point2 = new DetectionPoint(Category.INPUT_VALIDATION, "IE2", events12minutes5, responses);
		const point3 = new DetectionPoint(Category.INPUT_VALIDATION, "IE3", events13minutes6, responses);

		configuredDetectionPoints.push(point1);
		configuredDetectionPoints.push(point2);
		configuredDetectionPoints.push(point3);

		return configuredDetectionPoints;
	}

	private setRule(server: AppSensorServer | null, rule: Rule): void {
		const rules: Rule[] = [];
		rules.push(rule);

		this.appSensorServer!.getConfiguration()!.setRules(rules);
	}

	public override initializeTest(): void {
		if (AggregEventAnalysisEngIntegTest.myEngine === null) {
			super.initializeTest();

			this.appSensorServer.getConfiguration()!.
				setDetectionPoints(AggregEventAnalysisEngIntegTest.loadMockedDetectionPoints());
	
			const engines: EventAnalysisEngine[] = this.appSensorServer.getEventAnalysisEngines();
	
			for (const engine of engines) {
				if (engine instanceof AggregateEventAnalysisEngine){
					AggregEventAnalysisEngIntegTest.myEngine = engine as AggregateEventAnalysisEngine;
				}
			}
		}

		this.clearStores();

		// clear rules
		const emptyRules: Rule[] = [];
		this.appSensorServer.getConfiguration()!.setRules(emptyRules);
	}

	// this method doesn't actually wait, it just adds events with a predetermined time
	// does not check anything
	private async addEvent(detectionPoint: DetectionPoint, time: Date) {
        await this.appSensorClient!.getEventManager()!.addEvent(
            new AppSensorEvent(AggregEventAnalysisEngIntegTest.bob, 
                                detectionPoint, 
                                new DetectionSystem("localhostme"),
                                time));
	}

	//assumes no rules will be triggered until last event
	private async generateEvents(time: number, 
                           detectionPoint: DetectionPoint, 
                           eventCount: number, 
                           ruleName: string) {
        const attackStore = this.appSensorServer!.getAttackStore();
		const attacks = await attackStore!.findAttacks(AggregEventAnalysisEngIntegTest.criteria.get(ruleName)!);
        const attackCount: number = attacks.length;

        // let dateTime = new Date();

        const millis = time/eventCount;

        for (let i = 0; i < eventCount; i++) {
			const attacks = await attackStore!.findAttacks(AggregEventAnalysisEngIntegTest.criteria.get(ruleName)!);
            assert.equal(attackCount, attacks.length);

            await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(AggregEventAnalysisEngIntegTest.bob, detectionPoint, new DetectionSystem("localhostme")));

			await super.sleep(millis);
        }
	}

	private async assertEventsAndAttacks (eventCount: number, 
                                    attackCount: number, 
                                    criteria: SearchCriteria): Promise<void> {
        if (criteria.getRule() === null) {
			const events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
            assert.equal(eventCount, events.length);
        }
		const attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
        assert.equal(attackCount, attacks.length);
	}

	// @Test
	public async test1_DP1() {
		console.log('--> test1_DP1');
		//Add rule
		this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[0]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("all")!);

		// 3 events and triggered attack
		await this.generateEvents(this.sleepAmount * 3, 
                            AggregEventAnalysisEngIntegTest.detectionPoint1, 
                            3, 
                            "rule1");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		let attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(AggregEventAnalysisEngIntegTest.criteria.get("rule1")!);
		assert.equal(1, attacks.length);

		// 1 event and no new attack
		await this.generateEvents(this.sleepAmount, 
                            AggregEventAnalysisEngIntegTest.detectionPoint1, 
                            1,
                            "rule1");
		this.assertEventsAndAttacks(4, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(AggregEventAnalysisEngIntegTest.criteria.get("rule1")!);
		assert.equal(1, attacks.length);

		// 2 events and 2 total attack
		await this.generateEvents(this.sleepAmount * 2, 
                            AggregEventAnalysisEngIntegTest.detectionPoint1, 
                            2, 
                            "rule1");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(AggregEventAnalysisEngIntegTest.criteria.get("rule1")!);
		assert.equal(2, attacks.length);

		console.log('<-- test1_DP1');
	}

	// @Test
	public async test2_DP1andDP2() {
		console.log('--> test2_DP1andDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[1]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("all")!);

		//triggers attack
		await this.generateEvents(this.sleepAmount * 3, 
                            AggregEventAnalysisEngIntegTest.detectionPoint1, 
                            3, 
                            "rule2");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount * 12, 
                            AggregEventAnalysisEngIntegTest.detectionPoint2, 
                            12, 
                            "rule2");
		this.assertEventsAndAttacks(12, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		//check since last attack
		await this.generateEvents(this.sleepAmount, AggregEventAnalysisEngIntegTest.detectionPoint1, 1, "rule2");
		this.assertEventsAndAttacks(4, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount, AggregEventAnalysisEngIntegTest.detectionPoint2, 1, "rule2");
		this.assertEventsAndAttacks(13, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		//triggers attack in reverse
		await this.generateEvents(this.sleepAmount*11, AggregEventAnalysisEngIntegTest.detectionPoint2, 11, "rule2");
		this.assertEventsAndAttacks(24, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount*2, AggregEventAnalysisEngIntegTest.detectionPoint1, 2, "rule2");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		// trigger dp1 two times, no new attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule2");
		this.assertEventsAndAttacks(9, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule2");
		this.assertEventsAndAttacks(12, 4, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		// trigger dp2, attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule2");
		this.assertEventsAndAttacks(36, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 3, AggregEventAnalysisEngIntegTest.criteria.get("rule2")!);

		console.log('<-- test2_DP1andDP2');
	}

	// @Test
	public async test3_DP1orDP2() {
		console.log('--> test3_DP1orDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[2]);;

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("all")!);

		//triggers attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule3");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule3");
		this.assertEventsAndAttacks(12, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		//check since last attack
		await this.generateEvents(this.sleepAmount, AggregEventAnalysisEngIntegTest.detectionPoint1, 1, "rule3");
		this.assertEventsAndAttacks(4, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		await this.generateEvents(this.sleepAmount, AggregEventAnalysisEngIntegTest.detectionPoint2, 1, "rule3");
		this.assertEventsAndAttacks(13, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		//triggers attack in reverse order
		await this.generateEvents(this.sleepAmount*11, AggregEventAnalysisEngIntegTest.detectionPoint2, 11, "rule3");
		this.assertEventsAndAttacks(24, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 3, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		//won't trigger because attack already happened
		await this.generateEvents(this.sleepAmount*2, AggregEventAnalysisEngIntegTest.detectionPoint1, 2, "rule3");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 3, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		//now it will trigger
		await this.generateEvents(this.sleepAmount, AggregEventAnalysisEngIntegTest.detectionPoint1, 1, "rule3");
		this.assertEventsAndAttacks(7, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 4, AggregEventAnalysisEngIntegTest.criteria.get("rule3")!);

		console.log('<-- test3_DP1orDP2');
	}

	// @Test
	public async test4_DP1orDP2andDP3() {
		console.log('--> test4_DP1orDP2andDP3');
		//Add rule
		this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[3]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("all")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP3 AND DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*13, AggregEventAnalysisEngIntegTest.detectionPoint3, 13, "rule4");
		this.assertEventsAndAttacks(13, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp3")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule4");
		this.assertEventsAndAttacks(12, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 3, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(9, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 4, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP3 no new attack
		await this.generateEvents(this.sleepAmount*13, AggregEventAnalysisEngIntegTest.detectionPoint3, 13, "rule4");
		this.assertEventsAndAttacks(26, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp3")!);
		this.assertEventsAndAttacks(0, 4, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(12, 4, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 5, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP2 - no new attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule4");
		this.assertEventsAndAttacks(24, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 5, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		//DP3 trigger attack
		await this.generateEvents(this.sleepAmount*13, AggregEventAnalysisEngIntegTest.detectionPoint3, 13, "rule4");
		this.assertEventsAndAttacks(39, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp3")!);
		this.assertEventsAndAttacks(0, 6, AggregEventAnalysisEngIntegTest.criteria.get("rule4")!);

		console.log('<-- test4_DP1orDP2andDP3');
	}

	// @Test
	public async test5_DP1thenDP2() {
		console.log('--> test5_DP1thenDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[4]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("all")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule5");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule5")!);

		//DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule5");
		this.assertEventsAndAttacks(12, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule5")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*11, AggregEventAnalysisEngIntegTest.detectionPoint2, 11, "rule5");
		this.assertEventsAndAttacks(23, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule5")!);

		await this.generateEvents(this.sleepAmount*1, AggregEventAnalysisEngIntegTest.detectionPoint2, 1, "rule5");
		this.assertEventsAndAttacks(24, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule5")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule5");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule5")!);

		//DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule5");
		this.assertEventsAndAttacks(36, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule5")!);

		console.log('<-- test5_DP1thenDP2');
	}

	// @Test
	public async test6_DP1thenDP2thenDP1orDP2() {
		console.log('--> test6_DP1thenDP2thenDP1orDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[5]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("all")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(12, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(9, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		this.clearStores();

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(12, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(3, 1, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(24, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 0, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP2 - attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(36, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(6, 2, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregEventAnalysisEngIntegTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(9, 3, AggregEventAnalysisEngIntegTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(48, 4, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		//DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*12, AggregEventAnalysisEngIntegTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(60, 5, AggregEventAnalysisEngIntegTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregEventAnalysisEngIntegTest.criteria.get("rule6")!);

		console.log('<-- test6_DP1thenDP2thenDP1orDP2');
	}

	// test the scheduling bug
	// @Test
	public async test7_DP1andDP4orDP1andDP3thenDP1() {
		console.log('--> test7_DP1andDP4orDP1andDP3thenDP1');

		let time = new Date(100 * 60 * 60 * 1000);
		const ruleCriteria = new SearchCriteria().
			setUser(AggregEventAnalysisEngIntegTest.bob).
			setRule(AggregEventAnalysisEngIntegTest.rules[6]).
			setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1);

        this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[6]);

		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, time);
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 1 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 3 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 4 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 5 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 6 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 8 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 9 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 10 * 60 * 1000));

		let attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria);
		assert.equal(1, attacks.length);

		time = new Date(time.getTime() + 1 * 60 * 60 * 1000);

		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, time);
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 2 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 3 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 3 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 3 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 3 * 60 * 1000 + 30 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 4 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 4 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 4 * 60 * 1000 + 30 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 5 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 5 * 60 * 1000 + 30 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 6 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 6 * 60 * 1000 + 30 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 7 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 7 * 60 * 1000 + 30 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 8 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 8 * 60 * 1000 + 30 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint3, new Date(time.getTime() + 9 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint4, new Date(time.getTime() + 11 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 13 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 14 * 60 * 1000));
		await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 15 * 60 * 1000));

		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria);
		assert.equal(2, attacks.length);

		console.log('<-- test7_DP1andDP4orDP1andDP3thenDP1');
	}

	// test the earliest attack bug
		// @Test
    public async test8_DP1() {
		console.log('--> test8_DP1');

        let time = new Date(100 * 60 * 60 * 1000);
        const ruleCriteria = new SearchCriteria().
            setUser(AggregEventAnalysisEngIntegTest.bob).
            setRule(AggregEventAnalysisEngIntegTest.rules[0]).
            setDetectionSystemIds(AggregEventAnalysisEngIntegTest.detectionSystems1);

        this.setRule(this.appSensorServer, AggregEventAnalysisEngIntegTest.rules[0]);

        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, time);
        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 1 * 60 * 1000));
        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));

		let attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria);
        assert.equal(1, attacks.length);

        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 3 * 60 * 1000));
        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 4 * 60 * 1000));

		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria);
        assert.equal(1, attacks.length);

        time = new Date(time.getTime() + 1 * 60 * 60 * 1000);

        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, time);

		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria);
        assert.equal(1, attacks.length);

        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 1 * 60 * 1000));
        await this.addEvent(AggregEventAnalysisEngIntegTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));

		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria);
        assert.equal(2, attacks.length);

		console.log('<-- test8_DP1');
    }

	public static async runTests() {
		console.log();
		console.log('----- Run AggregateEventAnalysisEngineIntegrationTest -----');
		const instance = new AggregEventAnalysisEngIntegTest();

		instance.initializeTest();
		await instance.test1_DP1();

		instance.initializeTest();
		await instance.test2_DP1andDP2();

		instance.initializeTest();
		await instance.test3_DP1orDP2();

		instance.initializeTest();
		await instance.test4_DP1orDP2andDP3();

		instance.initializeTest();
		await instance.test5_DP1thenDP2();

		instance.initializeTest();
		await instance.test6_DP1thenDP2thenDP1orDP2();

		instance.initializeTest();
		await instance.test7_DP1andDP4orDP1andDP3thenDP1();

		instance.initializeTest();
		await instance.test8_DP1();
	}

}

export {AggregEventAnalysisEngIntegTest as AggregateEventAnalysisEngineIntegrationTest};