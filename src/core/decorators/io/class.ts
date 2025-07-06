
import { Constructor, SessionContextConstructor, Master, MiddlewareHandler, NextMiddleware, HandlerData } from "../../types/types";
import { LoggerFactory } from "../../logger/logger.factory";
import { Service } from "../iot/service";
import { registerBotAndBootstrap } from "metagram@core/engine/listener.engine";
import { handlerMiddlewaresKeySymbol } from "metagram@core/metadata/keys";
import { SingletonService } from "metagram@core/singleton/singleton";

export const Handler = (data: HandlerData = {
    middlewares: []
}) => {
    return <T extends Constructor>(target: T): T => { 
        Reflect.defineMetadata(
            handlerMiddlewaresKeySymbol,
            data.middlewares,
            target
        )
        return Service(target)
    }
};

export const Middleware = (
    data?: NextMiddleware
) => {
    return <T extends Constructor<MiddlewareHandler>> (target: T) => {
        return class extends target {
            nextMiddleware: MiddlewareHandler;

            constructor(...args: any[]) {
                super(...args)
                if (data?.next) {
                    const rejectCopy = this.reject 
                    this.reject = async function (ctx) {
                        const result = await rejectCopy(ctx)
                        if (result) {
                            const nextResult = await SingletonService.loadClassInstance(data.next).reject(ctx)
                            return nextResult
                        }
                        return result
                    }
                }
            }
        }
    }
}

export const SessionContext = <T extends SessionContextConstructor>(target: T) => {
    return target;
};

export const TelegramMaster = ({
    updatedFetchStrategy,
    messageListeners = [],
    sessionContexts = [],
    callbackQueryListeners = [],
    middlewares = []
}: Master) => {
    return <T extends Constructor>(target: T) => {
        return class extends target {
            constructor(...args: any[]) {
                super(...args);
                const token = updatedFetchStrategy.data.botToken;
                const botlogger = LoggerFactory().getBotLogger(token);

                botlogger.info(`[TelegramMaster] Bootstrapping Telegram bot for class ${target.name}`);

                registerBotAndBootstrap(
                    middlewares,
                    messageListeners, 
                    callbackQueryListeners, 
                    sessionContexts, 
                    updatedFetchStrategy, 
                    botlogger
                );
            }
        };
    };
};
