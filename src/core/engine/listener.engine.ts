// FULL FILE — WITH COMPLETE LOGGING ENHANCEMENTS
import "reflect-metadata";
import { Context, Telegraf } from "telegraf";
import { LoggerFactory } from "metagram@core/logger/logger.factory";
import { registerWebhookUpdateListenerStrategy } from "metagram@core/strategy/webhook";
import { Logger } from "pino";
import { TgMessageContext, TgCallbackQueryContext, SessionContextWithChildren, ISessionContext, Constructor, ContextPredicate, WebhookFetchStrategy, PollingFetchStrategy, MiddlewareHandlerConstructor, IMountArgs, LoadListeners } from "metagram@core/types/types";
import { messageMetaKey, sendMessageMetaKey, sessionContextMetaKey, contextPredicateMetaKey, classErrorHandlerKey, methodErrorHandlerKey, onMessageMetaKey, onCallbackMetaKey, handlerMiddlewaresKeySymbol, nextMiddlewareKeySymbol } from "metagram@core/metadata/keys";
import { SingletonService } from "metagram@core/singleton/singleton";

let logger = LoggerFactory().getDefaultLogger()


export const initSessionContexts = async (
    ctx: TgMessageContext | TgCallbackQueryContext,
    sessionContexts: SessionContextWithChildren[],
    initialized: ISessionContext[] = []
): Promise<ISessionContext[]> => {
    console.log(initialized)
    logger.info("[initSessionContexts] Initializing session contexts...");

    for (const {
        sessionContext,
        children = []
    } of sessionContexts) {
        const args: any[] = []

        const paramTypes = Reflect.getMetadata("design:paramtypes", sessionContext) ?? []

        for (const paramType of paramTypes) {
            args.push(initialized.find(session => session.constructor === paramType))
        }
        
        const session = new sessionContext(...args);

        logger.info(`[initSessionContexts] Loading context for session: ${sessionContext.name}`);
        await session.loadContext(ctx);

        initialized.push(session);

        logger.info(`[initChildrenSessionContexts] Loading Children contexts for session: ${sessionContext.name}`);
        const childrenSessionContextsResult = await initSessionContexts(ctx, children, initialized)

        initialized = [
            ...initialized,
            ...childrenSessionContextsResult
        ]
    }

    logger.info("[initSessionContexts] All session contexts initialized");
    return initialized;
};

const loadListenerAndExec = async ({
    globalErrorHandler,
    listener,
    methodErrorHandler,
    method,
    args,
    ctx,
    logger,
    sessionContexts
}: LoadListeners) => {
    const instanceArgs = mountArgs({ listener, ctx, sessionContexts });

    const instance = instanceArgs ? new listener(...instanceArgs) : SingletonService.loadClassInstance(listener);

    logger.trace(`[loadListenerAndExec] Calling ${listener.name}.${method} with ${args.length} args`);
    try {
        await instance[method](...args);
        logger.info(`[loadListenerAndExec] Successfully executed ${listener.name}.${method}`);
    } catch (e) {
        logger.error(e, `[loadListenerAndExec] Error in ${listener.name}.${method}`);
        if (methodErrorHandler) {
            logger.info(`[loadListenerAndExec] Handling with methodErrorHandler`);
            methodErrorHandler(ctx, e);
        } else if (globalErrorHandler) {
            logger.info(`[loadListenerAndExec] Handling with globalErrorHandler`);
            globalErrorHandler(ctx, e);
        } else {
            logger.error("Unhandled error in message listener", e);
            throw e;
        }
    }
};

const mountArgs = ({ sessionContexts, listener, method, ctx }: IMountArgs): any[] => {
    logger.trace(`[mountArgs] Mounting args for ${listener.name}.${method}`);
    const args: any[] = [];

    const prototypeOrCosntructor = method ? listener.prototype : listener

    const messageArgs: number[] = Reflect.getMetadata(messageMetaKey, prototypeOrCosntructor, method) ?? [];
    const sendMessageArgs: number[] = Reflect.getMetadata(sendMessageMetaKey, prototypeOrCosntructor, method) ?? [];
    const sessionContextArgs: number[] = Reflect.getMetadata(sessionContextMetaKey, prototypeOrCosntructor, method) ?? [];
    const paramsTypes: any[] = Reflect.getMetadata("design:paramtypes", prototypeOrCosntructor, method) ?? [];

    for (const messageArg of messageArgs) {
        args[messageArg] = ctx.message;
        logger.debug(`[mountArgs] Injected message at index ${messageArg}`);
    }

    for (const sendMessageArg of sendMessageArgs) {
        ctx.sendMessage = ctx.sendMessage.bind(ctx);
        args[sendMessageArg] = ctx.sendMessage;
        logger.debug(`[mountArgs] Injected sendMessage at index ${sendMessageArg}`);
    }

    for (const sessionContextArg of sessionContextArgs) {
        const expected = paramsTypes[sessionContextArg];
        for (const session of sessionContexts) {
            if (session.constructor === expected) {
                args[sessionContextArg] = session;
                logger.debug(`[mountArgs] Injected sessionContext (${expected.name}) at index ${sessionContextArg}`);
            }
        } 
    }

    logger.trace(`[mountArgs] Final args: ${JSON.stringify(args)}`);
    return args;
};

const skipMethodExecution = ({ listener, method, ctx }: {
    listener: Constructor;
    method: string;
    ctx: Context;
}): boolean => {
    const predicates = Reflect.getMetadata(contextPredicateMetaKey, listener.prototype, method) as ContextPredicate[];

    for (const predicate of predicates) {
        const result = predicate(ctx);
        logger.debug(`[skipMethodExecution] Predicate ${predicate.name || 'anonymous'} => ${result}`);
        if (!result) {
            logger.debug(`[skipMethodExecution] Skipping method ${listener.name}.${method}`);
            return true;
        }
    }

    return false;
};

const skipExecutionOnAllMiddlewareReject = async (
    ctx: Context,
    middlewares: MiddlewareHandlerConstructor[],
    sessionContexts: ISessionContext[]
): Promise<boolean> => {
    for (const middleware of middlewares) {
        const args = mountArgs({ listener: middleware, ctx, sessionContexts });
        const shouldReject = (args ? new middleware(...args) : SingletonService.loadClassInstance(middleware)).reject(ctx)
        if (shouldReject) {
            const nextMiddleware: MiddlewareHandlerConstructor | undefined = Reflect.getMetadata(
                nextMiddlewareKeySymbol,
                middleware
            )
            if (nextMiddleware) {
                return await skipExecutionOnAllMiddlewareReject(
                    ctx,
                    [nextMiddleware],
                    sessionContexts
                )
            }
            return true
        }
    }

    return false
}

const evalListenersForContext = async (
    onEventMetaKey: symbol,
    ctx: TgMessageContext | TgCallbackQueryContext,
    listeners: Constructor[],
    sessionContextTypes: SessionContextWithChildren[],
    middlewares: MiddlewareHandlerConstructor[],
    logger: Logger
) => {
    logger.info(`[evalListenersForContext] Evaluating listeners for ${onEventMetaKey.toString()}`);
    const sessionContexts = await initSessionContexts(ctx, sessionContextTypes);

    logger.info(`[skipExecutionOnAllMiddlewareReject] Evaluating middlewares for ${onEventMetaKey.toString()}`);
    const skipExecution = await skipExecutionOnAllMiddlewareReject(
        ctx,
        middlewares,
        sessionContexts
    )

    if (skipExecution) {
        logger.info(`[skipExecutionOnAllMiddlewareReject] Skipping execution for ${onEventMetaKey.toString()}`);
        return
    }

    for (const listener of listeners) {
        logger.info(`[skipExecutionOnAllMiddlewareReject] Loading middlewares for handler ${listener.name}`);
        const middlewaresPerHandler: MiddlewareHandlerConstructor[] = Reflect.getMetadata(
            handlerMiddlewaresKeySymbol,
            listener
        ) ?? []

        logger.info(`[skipExecutionOnAllMiddlewareReject] Evaluating middlewares for handler ${listener.constructor.name}`);
        const skipExecution = await skipExecutionOnAllMiddlewareReject(
            ctx,
            middlewaresPerHandler,
            sessionContexts
        )

        if (skipExecution) {
            logger.info(`[skipExecutionOnAllMiddlewareReject] Skipping execution for handler ${listener.constructor.name}`);
            continue
        }


        const methods = Reflect.getMetadata(onEventMetaKey, listener.prototype) ?? [];
        const globalErrorHandler = Reflect.getMetadata(classErrorHandlerKey, listener);

        for (const method of methods) {
            const methodErrorHandler = Reflect.getMetadata(methodErrorHandlerKey, listener.prototype, method);
            if (skipMethodExecution({ method, listener, ctx })) continue;

            const args = mountArgs({ method, listener, ctx, sessionContexts });
            await loadListenerAndExec({
                method,
                listener,
                ctx,
                args,
                methodErrorHandler,
                globalErrorHandler,
                logger,
                sessionContexts
            });
        }
    }
};

export const registerBotAndBootstrap = (
    middlewares: MiddlewareHandlerConstructor[],
    messageListeners: Constructor[],
    callbackQueryListeners: Constructor[],
    sessionContexts: SessionContextWithChildren[],
    strategy: WebhookFetchStrategy | PollingFetchStrategy,
    logger: Logger
) => {
    const token = strategy.data.botToken;
    logger.info("[registerBotAndBootstrap] Booting Telegram bot...");

    const bot = new Telegraf(token);

    bot.on("message", async ctx => {
        logger.trace("[BotEvent] message received");
        await evalListenersForContext(onMessageMetaKey, ctx, messageListeners, sessionContexts, middlewares, logger);
    });

    bot.on("callback_query", async ctx => {
        logger.trace("[BotEvent] callback_query received");
        await evalListenersForContext(onCallbackMetaKey, ctx, callbackQueryListeners, sessionContexts, middlewares, logger);
    });

    if (strategy.type === "POLLING") {
        logger.info("[registerBotAndBootstrap] Using polling strategy");
        bot.launch().then(() => logger.info("Bot launched")).catch(e => logger.error(e, "Polling failed"));
    } else {
        logger.info("[registerBotAndBootstrap] Using webhook strategy");
        registerWebhookUpdateListenerStrategy(strategy.data, bot, logger).catch(e => logger.error(e, "Webhook failed"));
    }
};