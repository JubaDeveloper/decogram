import "reflect-metadata";
import { Constructor, SessionContextConstructor, Master, MiddlewareHandler, NextMiddleware, ApplyData } from "../../types/types";
import { LoggerFactory } from "../../logger/logger.factory";
import { Service } from "../iot/service";
import { registerBotAndBootstrap } from "metagram@core/engine/listener.engine";
import { applyMetaKeySymbol, nextMiddlewareKeySymbol, onCallbackMetaKey, onMessageMetaKey } from "metagram@core/metadata/keys";
import { OnCallbackInMessageHandlerError, OnMessageInCallbackHandlerError } from "metagram@core/errors/errors";

const Handler = () => {
	return <T extends Constructor>(target: T): T => { 
		return Service(target)
	}
};

export const MessageHandler = () => {
	return <T extends Constructor>(target: T): T => { 
		if (Reflect.getMetadataKeys(target.prototype).includes(onCallbackMetaKey)) {
			throw OnCallbackInMessageHandlerError
		}

		return Handler()(target)
	}
}

export const CallbackHandler = () => {
	return <T extends Constructor>(target: T): T => { 

		if (Reflect.getMetadataKeys(target.prototype).includes(onMessageMetaKey)) {
			throw OnMessageInCallbackHandlerError
		}

		return Handler()(target)
	}
}

/**
 * Used to apply a single or multi
 * middlewares in the execution of
 * a method or class
 */
export const Apply = (
	middleware: ApplyData
) => {
	return <T extends Object | Constructor>(
		target: T, 
		propKey?: symbol | string, 
		_descriptor?: TypedPropertyDescriptor<unknown>
	) => {
		Reflect.defineMetadata(
			applyMetaKeySymbol,
			Array.isArray(middleware) ? middleware : [middleware],
			target,
			propKey
		)
	}
}

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
		if (data?.next) Reflect.defineMetadata(
			nextMiddlewareKeySymbol,
			data.next,
			target
		)

		return Service(target)
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
		return Service(class extends target {
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
		})
	};
};
