import { Logger } from "pino";
import { Telegraf } from "telegraf";
import { SingletonService } from "../singleton/singleton";
import { WebhookStrategy } from "../types/types";

class UpdateListenerStrategyApplication {
	constructor(
        private readonly app: import("express").Express, 
        private readonly port: number,
        logger: Logger
	) {
		this.listen(logger);
	}
	public getApp() { return this.app }

	private listen(logger: Logger) {
		this.app.listen(this.port, () => {
			logger.trace(`New Webhook App Created - Listening on port ${this.port}`);
		});
	}
}

export const registerWebhookUpdateListenerStrategy = async (
	strategy: WebhookStrategy,
	bot: Telegraf,
	logger: Logger
): Promise<void> => {
	const express = (await import("express")).default;

	const app = new UpdateListenerStrategyApplication(
		express(), 
		strategy.listenOnPort,
		logger
	);

	const expressApp = app.getApp();

	const endpoint = `/telegram/webhook/${strategy.botToken}`;

	const webhook = await SingletonService.loadClassInstancePerArgsOrEvalPredicate(endpoint, async () => bot.webhookCallback(endpoint));

	expressApp.post(endpoint, (req, res) => {
		webhook(req, res).catch(e => logger.error(e, "[Webhook] Error during update"));
	});

	logger.info(`Receiving bot updates at: http://localhost:${strategy.listenOnPort}${endpoint}`);

	if (strategy.callbackAfterRegister) {
		await strategy.callbackAfterRegister(strategy.botToken, strategy.listenOnPort);
	}
};
