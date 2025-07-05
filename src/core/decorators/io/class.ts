import { LoggerFactory } from "../../logger/logger.factory";
import { registerBotAndBootstrap } from "../../telegram/mounting/mounting";
import { Constructor, SessionContextConstructor, Master } from "../../types/types";
import { Service } from "../iot/service";

export const Handler = <T extends Constructor>(target: T): T => Service(target);

export const SessionContext = <T extends SessionContextConstructor>(target: T) => {
    return target;
};

export const TelegramMaster = ({
    updatedFetchStrategy,
    messageListeners = [],
    sessionContexts = [],
    callbackQueryListeners = []
}: Master) => {
    return <T extends Constructor>(target: T) => {
        return class extends target {
            constructor(...args: any[]) {
                super(...args);
                const token = updatedFetchStrategy.data.botToken;
                const botlogger = LoggerFactory().getBotLogger(token);

                botlogger.info(`[TelegramMaster] Bootstrapping Telegram bot for class ${target.name}`);

                registerBotAndBootstrap(messageListeners, callbackQueryListeners, sessionContexts, updatedFetchStrategy, botlogger);
            }
        };
    };
};
