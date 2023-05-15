import { AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine } from "../../core/analysis/analysis.js";
import { AppSensorEvent, AppSensorServer, Attack, DetectionPoint, Interval, INTERVAL_UNITS, Response, Threshold, User, Utils } from "../../core/core.js";
import { SearchCriteria } from "../../core/criteria/criteria.js";
import { Clause, Expression, Notification, Rule } from "../../core/rule/rule.js";
import { Logger } from "../../logging/logging.js";

class AggregateAttackAnalysisEngine extends AttackAnalysisEngine {

	private appSensorServer: AppSensorServer = new AppSensorServer();

	public getAppSensorServer(): AppSensorServer {
		return this.appSensorServer;
	}

	public setAppSensorServer(appSensorServer: AppSensorServer): void {
		this.appSensorServer = appSensorServer;
	}

	/**
	 * This method analyzes {@link Attack} objects that are added
	 * to the system (either via direct addition or generated by the event analysis
	 * engine), generates an appropriate {@link Response} object,
	 * and adds it to the configured {@link ResponseStore}
	 *
	 * @param event the {@link Attack} that was added to the {@link AttackStore}
	 */
	// @Override
	public async analyze(attack: Attack): Promise<void> {
		if (attack != null && attack.getRule() != null) {
			const response: Response = await this.findAppropriateResponse(attack);

			if (response != null) {
                let userName = Utils.getUserName(attack.getUser());

				Logger.getServerLogger().info("AggregateAttackAnalysisEngine.analyze:", `Response set for user <${userName}> - storing response action ${response.getAction()}`);
				
                const responseStore = this.appSensorServer.getResponseStore();
                if (responseStore !== null) {
                    await responseStore.addResponse(response);
                }
				
			}
		}
	}

	/**
	 * Find/generate {@link Response} appropriate for specified {@link Attack}.
	 *
	 * @param attack {@link Attack} that is being analyzed
	 * @return {@link Response} to be executed for given {@link Attack}
	 */
	protected async findAppropriateResponse(attack: Attack): Promise<Response> {
		const triggeringRule: Rule | null = attack.getRule();

		const criteria: SearchCriteria = new SearchCriteria().
				setUser(attack.getUser()).
				setRule(triggeringRule);

        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null) {
            criteria.setDetectionSystemIds(serverConfig.getRelatedDetectionSystems(attack.getDetectionSystem()));
        }

		//grab any existing responses
		let existingResponses: Response[] = []; 
        const responseStore = this.appSensorServer.getResponseStore();
        if (responseStore !== null) {
            existingResponses = await responseStore.findResponses(criteria);
        }

		let responseAction: string | null = null;
		let interval: Interval | null  | undefined= null;

		const possibleResponses: Response[] = this.findPossibleResponses(triggeringRule);

		if (existingResponses === null || existingResponses.length === 0) {
			//no responses yet, just grab first configured response from rule
            if (possibleResponses.length > 0) {
                const response: Response = possibleResponses[0];

                responseAction = response.getAction();
                interval = response.getInterval();
            }
			
		} else {
			for (const configuredResponse of possibleResponses) {
				responseAction = configuredResponse.getAction();
				interval = configuredResponse.getInterval();

				if (! this.isPreviousResponse(configuredResponse, existingResponses)) {
					//if we find that this response doesn't already exist, use it
					break;
				}

				//if we reach here, we will just use the last configured response (repeat last response)
			}
		}

		if(responseAction == null) {
            let name = '';
            if (triggeringRule) {
                name = triggeringRule.getName();
            }
			throw new Error("No appropriate response was configured for this rule: " + name);
		}

		const response: Response = new Response().
				setUser(attack.getUser()).
				setTimestamp(attack.getTimestamp()).
				setAction(responseAction).
				setInterval(interval).
				setDetectionSystem(attack.getDetectionSystem());

		return response;
	}

	/**
	 * Lookup configured {@link Response} objects for specified {@link Rule}
	 *
	 * @param rule triggered {@link Rule}
	 * @return collection of {@link Response} objects for given {@link Rule}
	 */
	protected findPossibleResponses(rule: Rule | null): Response[] {
		let possibleResponses: Response[] = [];

        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null) {
            for (const configuredRule of serverConfig.getRules()) {
                if (configuredRule.equals(rule)) {
                    possibleResponses = configuredRule.getResponses();
                    break;
                }
            }
        }

		return possibleResponses;
	}

	/**
	 * Test a given {@link Response} to see if it's been executed before.
	 *
	 * @param response {@link Response} to test to see if it's been executed before
	 * @param existingResponses set of previously executed {@link Response}s
	 * @return true if {@link Response} has been executed before
	 */
	protected isPreviousResponse(response: Response, existingResponses: Response[]): boolean {
		let previousResponse: boolean = false;

		for (const existingResponse of existingResponses) {
			if (response.getAction() === existingResponse.getAction()) {
				previousResponse = true;
			}
		}

		return previousResponse;
	}

}

class AggregateEventAnalysisEngine extends EventAnalysisEngine {

	private appSensorServer: AppSensorServer = new AppSensorServer();

	public getAppSensorServer(): AppSensorServer {
		return this.appSensorServer;
	}

	public setAppSensorServer(appSensorServer: AppSensorServer): void {
		this.appSensorServer = appSensorServer;
	}
	
	/**
	 * This method determines whether an {@link Event} that has been added to the system
	 * has triggered a {@link Rule}. If so, an {@link Attack} is generated.
	 *
	 * @param event the {@link Event} that was added to the {@link EventStore}
	 */
	// @Override
	public async analyze(triggerEvent: AppSensorEvent): Promise<void> {
		const serverConfiguration = this.appSensorServer.getConfiguration();

		if (serverConfiguration !== null) {
			const rules: Rule[] = serverConfiguration.findRules(triggerEvent);


			for (const rule of rules) {
				// if (this.checkRule(triggerEvent, rule)) {
				// 	this.generateAttack(triggerEvent, rule);
				// }
				const ruleFulfilled = await this.checkRule(triggerEvent, rule);
				if (ruleFulfilled) {
					await this.generateAttack(triggerEvent, rule);
				}
			}
		}
	}

	/**
	 * Evaluates a {@link Rule}'s logic by compiling a list of all {@link Notification}s
	 * and then evaluating each {@link Expression} within the {@link Rule}. All {@link Expression}s
	 * must evaluate to true within the {@link Rule}'s window for the {@link Rule} to evaluate to
	 * true. The process follows the "sliding window" pattern.
	 *
	 * @param event the {@link Event} that triggered analysis
	 * @param rule the {@link Rule} being evaluated
	 * @return the boolean evaluation of the {@link Rule}
	 */
	protected async checkRule(triggerEvent: AppSensorEvent, rule: Rule): Promise<boolean> {
		const notifications: Notification[] = await this.getNotifications(triggerEvent, rule);

		//PriorityQueue in java
		let windowedNotifications: Notification[] = [];

		const expressions: Expression[] = rule.getExpressions().slice();
		let currentExpression: Expression | undefined = expressions.shift();
	
		let tail: Notification | undefined = undefined;

		while (notifications.length > 0) {
			tail = notifications.shift();
			if (tail && currentExpression) {
				windowedNotifications.push(tail);
				windowedNotifications.sort((a, b) => {
					return Notification.getStartTimeAscendingComparator(a, b);
				});

				const tailEndTime = tail.getEndTime();
				const currExpWindow = currentExpression.getWindow();

				if (currExpWindow !== null) {
					this.trim(windowedNotifications, new Date(tailEndTime.getTime() - currExpWindow.toMillis()));
				}
				
	
				if (this.checkExpression(currentExpression, windowedNotifications)) {
					if (expressions.length > 0) {
						currentExpression = expressions.shift();
						windowedNotifications = [];
						this.trim(notifications, tailEndTime);
					}
					else {
						return true;
					}
				}
			}
		}

		return false;
	}

	/**
	 * Evaluates an {@link Expression}'s logic by evaluating all {@link Clause}s. Any
	 * {@link Clause} must evaluate to true for the {@link Expression} to evaluate to true.
	 *
	 * Equivalent to checking "OR" logic between {@link Clause}s.
	 *
	 * @param expression the {@link Expression} being evaluated
	 * @param notifications the {@link Notification}s in the current "sliding window"
	 * @return the boolean evaluation of the {@link Expression}
	 */
	public checkExpression(expression: Expression | undefined, notifications: Notification[]): boolean {
		if (expression) {
			for (const clause of expression.getClauses()) {
				if (this.checkClause(clause, notifications)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Evaluates a {@link Clause}'s logic by checking if each {@link MonitorPoint}
	 * within the {@link Clause} is in the current "sliding window".
	 *
	 * Equivalent to checking "AND" logic between {@link RuleDetectionPoint}s.
	 *
	 * @param clause the {@link Clause} being evaluated
	 * @param notifications the {@link Notification}s in the current "sliding window"
	 * @return the boolean evaluation of the {@link Clause}
	 */
	public checkClause(clause: Clause, notifications: Notification[]): boolean {
		const windowDetectionPoints: DetectionPoint[] = [];

		for (const notification of notifications) {
			const monitPoint = notification.getMonitorPoint();
			if (monitPoint !== null) {
				windowDetectionPoints.push(monitPoint);
			}
			
		}

		for (const detectionPoint of clause.getMonitorPoints()) {
			let contains = false;
			for (let i = 0; i < windowDetectionPoints.length; i++) {
				if (windowDetectionPoints[i] === detectionPoint ||
					windowDetectionPoints[i].equals(detectionPoint)) {
					contains = true;
					break;
				}
			}
			if (!contains) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Pops {@link Notification}s out of the queue until the start time of the queue's head
	 * is after the parameter time. The queue of notifications MUST be sorted in ascending
	 * order by start time.
	 *
	 * @param notifications the queue of {@link Notification}s being trimmed
	 * @param time the time that all {@link Notification}s in the queue must be after
	 */
	public trim(notifications: Notification[], time: Date): void {
		while (notifications.length > 0) {

			const startTime = notifications[0].getStartTime();
			if (!(time !== null && 
				  startTime.getTime() > time.getTime())) {
				notifications.shift();
			} else {
				break;
			}
			
		}
	}

	/**
	 * Builds a queue of all {@link Notification}s from the events relating to the
	 * current {@link Rule}. The {@link Notification}s are ordered in the Queue by
	 * start time.
	 *
	 * @param triggerEvent the {@link Event} that triggered analysis
	 * @param rule the {@link Rule} being evaluated
	 * @return a queue of {@link TriggerEvents}
	 */
	protected async getNotifications(triggerEvent: AppSensorEvent, rule: Rule): Promise<Notification[]> {
		const notificationQueue: Notification[] = [];
		const events: AppSensorEvent[] = await this.getApplicableEvents(triggerEvent, rule);
		const detectionPoints: DetectionPoint[] = rule.getAllDetectionPoints();

		for (const detectionPoint of detectionPoints) {
			const eventQueue: AppSensorEvent[] = [];

			for (const event of events) {
				const eventDetPoint = event.getDetectionPoint();
				if (eventDetPoint !== null && eventDetPoint.typeAndThresholdMatches(detectionPoint)) {
					eventQueue.push(event);

					const detPointThreshold = detectionPoint.getThreshold();

					if (this.isThresholdViolated(eventQueue, event, detPointThreshold)) {
						const queueDuration: number = this.getQueueInterval(eventQueue, event).toMillis();
						const start: Date = new Date(eventQueue[0].getTimestamp());

						const notification: Notification = new Notification(queueDuration, INTERVAL_UNITS.MILLISECONDS, start, detectionPoint);
						notificationQueue.push(notification);
					}

					if (detPointThreshold !== null && eventQueue.length >= detPointThreshold.getCount()) {
						eventQueue.shift();
					}
				}
			}
		}

		notificationQueue.sort((a, b) => {
			return Notification.getEndTimeAscendingComparator(a, b);
		});

		return notificationQueue;
	}

	/**
	 * Determines whether a queue of {@link Event}s crosses a {@link Threshold} in the correct
	 * amount of time.
	 *
	 * @param queue a queue of {@link Event}s
	 * @param tailEvent the {@link Event} at the tail of the queue
	 * @param threshold the {@link Threshold} to evaluate
	 * @return boolean evaluation of the {@link Threshold}
	 */
	public isThresholdViolated(queue: AppSensorEvent[], tailEvent: AppSensorEvent, 
		                       threshold: Threshold | null): boolean {
		let queueInterval: Interval | null = null;

		if (threshold !== null && queue.length >= threshold.getCount()) {
			queueInterval = this.getQueueInterval(queue, tailEvent);

			const thresholdInt = threshold.getInterval();
			if (queueInterval !== null && thresholdInt !== null &&
				queueInterval.toMillis() <= thresholdInt.toMillis()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Determines the time between the {@link Event} at the head of the queue and the
	 * {@link Event} at the tail of the queue.
	 *
	 * @param queue a queue of {@link Event}s
	 * @param tailEvent the {@link Event} at the tail of the queue
	 * @return the duration of the queue as an {@link Interval}
	 */
	public getQueueInterval(queue: AppSensorEvent[], tailEvent: AppSensorEvent): Interval {

		const endTime = tailEvent.getTimestamp();
		const startTime = queue[0].getTimestamp();

		return new Interval(endTime.getTime() - startTime.getTime(), INTERVAL_UNITS.MILLISECONDS);
	}

	/**
	 * Generates an attack from the given {@link Rule} and triggered {@link Event}
	 *
	 * @param triggerEvent the {@link Event} that triggered the {@link Rule}
	 * @param rule the {@link Rule} being evaluated
	 */
	public async generateAttack(triggerEvent: AppSensorEvent, rule: Rule) {
		let userName = Utils.getUserName(triggerEvent.getUser());

		Logger.getServerLogger().info("AggregateEventAnalysisEngine.generateAttack:", `Attack generated on rule: ${rule.getGuid()} by user: ${userName}`);

		const attack: Attack = new Attack().
			setUser(new User(userName)).
			setRule(rule).
			setTimestamp(triggerEvent.getTimestamp()).
			setDetectionSystem(triggerEvent.getDetectionSystem()).
			setResource(triggerEvent.getResource());


		const attackStore = this.appSensorServer.getAttackStore();
		if (attackStore !== null) {
			await attackStore.addAttack(attack);
		}
		
	}

	/**
	 * Finds all {@link Event}s related to the {@link Rule} being evaluated.
	 *
	 * @param triggerEvent the {@link Event} that triggered the {@link Rule}
	 * @param rule the {@link Rule} being evaluated
	 * @return a list of {@link Event}s applicable to the {@link Rule}
	 */
	protected async getApplicableEvents(triggerEvent: AppSensorEvent, rule: Rule): Promise<AppSensorEvent[]> {
		let events: AppSensorEvent[] = [];

		let ruleStartTime: Date = triggerEvent.getTimestamp();
		const ruleWindow = rule.getWindow();
		if (ruleWindow !== null) {
			ruleStartTime = new Date(ruleStartTime.getTime() - ruleWindow.toMillis());
		}

		const lastAttackTime: Date = await this.findMostRecentAttackTime(triggerEvent, rule);
		const earliest: Date = (ruleStartTime.getTime() > lastAttackTime.getTime()) ? ruleStartTime : lastAttackTime;

		const criteria: SearchCriteria = new SearchCriteria().
				setUser(triggerEvent.getUser()).
				setEarliest(new Date(earliest.getTime() + 1)).
				setRule(rule);

		const serverConfig = this.appSensorServer.getConfiguration();
		if (serverConfig !== null) {
			criteria.setDetectionSystemIds(serverConfig.getRelatedDetectionSystems(triggerEvent.getDetectionSystem()));
		}

		const eventStore = this.appSensorServer.getEventStore();
		if (eventStore !== null) {
			events = await eventStore.findEvents(criteria);
		}

		events.sort((a, b) => { 
			return AppSensorEvent.getTimeAscendingComparator(a, b);
		});

		return events;
	}

	/**
	 * Finds the most recent {@link Attack} from the {@link Rule} being evaluated.
	 *
	 * @param triggerEvent the {@link Event} that triggered the {@link Rule}
	 * @param rule the {@link Rule} being evaluated
	 * @return a {@link DateTime} of the most recent attack related to the {@link Rule}
	 */
	protected async findMostRecentAttackTime(triggerEvent: AppSensorEvent, rule: Rule): Promise<Date> {
		let newest: Date = new Date(0);

		let userName = Utils.getUserName(triggerEvent.getUser());

		let criteria: SearchCriteria = new SearchCriteria().
				setUser(new User(userName)).
				setRule(rule);

        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null) {
			criteria.setDetectionSystemIds(serverConfig.getRelatedDetectionSystems(triggerEvent.getDetectionSystem()));
        }

		const attackStore = this.appSensorServer.getAttackStore();
		if (attackStore !== null) {
			const attacks: Attack[] = await attackStore.findAttacks(criteria);

			for (const attack of attacks) {
				const attackRule = attack.getRule();
				if (attackRule !== null && attackRule.guidMatches(rule)) {
					const attackTimestamp = attack.getTimestamp();
					if (attackTimestamp.getTime() > newest.getTime()) {
						newest = new Date(attackTimestamp);
					}
				}
			}
		}

		return newest;
	}
}

class AggregateResponseAnalysisEngine extends ResponseAnalysisEngine {

	/**
	 * This method simply logs responses.
	 *
	 * @param response {@link Response} that has been added to the {@link ResponseStore}.
	 */
	public async analyze(response: Response): Promise<void> {
		if (response != null) {
            let userName = Utils.getUserName(response.getUser());

			Logger.getServerLogger().trace("AggregateResponseAnalysisEngine.analyze:", `NO-OP Response for user <${userName}> - should be executing response action ${response.getAction()}`);
		}
	}

}

export {AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine, AggregateResponseAnalysisEngine};