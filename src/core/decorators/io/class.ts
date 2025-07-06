
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

/**
 * Middleware Decorator
 * 
 * The `@Middleware` decorator is used to define middleware handlers that can reject the processing
 * of a Telegram update (message or callback) before it reaches any listener.
 * 
 * It supports **chaining** by accepting a `next` middleware, allowing a flow similar to Express-style
 * or NestJS-style middleware composition.
 * 
 * ### Behavior
 * - The middleware must implement the `MiddlewareHandler` interface, which requires a `reject(ctx)` method.
 * - If `reject(ctx)` returns `true`, it signals that processing should **not continue**.
 * - If a `next` middleware is defined via `@Middleware({ next })`, and the current middleware returns `true`,
 *   the next middleware in the chain will be executed and its result will determine the final decision.
 * - The flow is **discarded only when all chained middlewares return `true`** — otherwise, it proceeds.
 * 
 * ### Usage
 * ```ts
 * @Middleware({
 *   next: AnotherMiddlewareClass
 * })
 * export class MyMiddleware implements MiddlewareHandler {
 *   async reject(ctx: Context): Promise<boolean> {
 *     // Return true to stop processing, false to allow it.
 *     return ctx.message?.text === "/block";
 *   }
 * }
 * ```
 * 
 * ### Chaining
 * Middleware can be chained to form a conditional rejection tree. If one middleware rejects but the next does not,
 * the flow is allowed. Only when **all middlewares in the chain** reject, the execution is skipped.
 * 
 * This is useful for:
 * - Authentication & permission checks
 * - Rate limiting
 * - Language or bot configuration filters
 * - Global or handler-level guards
 * 
 * @param data Optional object with a `next` property pointing to the next middleware in the chain.
 */
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
