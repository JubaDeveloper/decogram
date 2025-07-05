import { Logger } from "pino";
import { Telegraf } from "telegraf";

export const registerPollingUpdateListenerStrategy = (
    bot: Telegraf,
    logger: Logger
) => {
    bot.launch()
        .then(() => logger.info("Bot launched"))
        .catch(e => logger.error(e, "Polling failed"));
}