import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Message as TelegramMessage, Update } from "telegraf/types";

// General Constructor
export type Constructor<T = any> = { new (...args: any[]): T };

// Telegraf Context Types
export type SendMessageMethod = Context["sendMessage"];
export type MessageContext = TelegramMessage & { text: string };

export type TgMessageContext = NarrowedContext<Context<Update>, Update.MessageUpdate<TelegramMessage>>;
export type TgCallbackQueryContext = NarrowedContext<Context<Update>, Update.CallbackQueryUpdate<CallbackQuery & { data?: string }>>;

// Predicate Function Type
export type ContextPredicate<T extends Context = Context> = (ctx: T) => boolean;

// SessionContext Interface
export interface ISessionContext {
    loadContext(ctx: Context): void | Promise<void>;
}

export interface SessionContextWithChildren {
    sessionContext: Constructor<ISessionContext>;
    children?: SessionContextWithChildren[];
}

// Error Handler Function Type
export type ErrorHandler = (ctx: Context, error: unknown) => any;

// Bot Strategy Interfaces
export interface BotTokenData {
    botToken: string;
}

export interface PollingStrategy extends BotTokenData {
    dropPendingUpdates?: boolean;
}

export interface WebhookStrategy extends BotTokenData {
    listenOnPort: number;
    privateKey?: string;
    callbackAfterRegister?: CallbackAfterRegister;
}

export type CallbackAfterRegister = (botToken: string, port: number) => Promise<void> | void;

export interface PollingFetchStrategy {
    type: "POLLING";
    data: PollingStrategy;
}

export interface WebhookFetchStrategy {
    type: "WEBHOOK";
    data: WebhookStrategy;
}

// TelegramMaster Bootstrapping Input
export interface Master extends Middlewares {
    updatedFetchStrategy: WebhookFetchStrategy | PollingFetchStrategy;
    messageListeners?: Constructor[];
    callbackQueryListeners?: Constructor[];
    sessionContexts?: SessionContextWithChildren[];
}

export interface DefineListenerMetadata {
    predicates: ContextPredicate<TgCallbackQueryContext | TgMessageContext>[];
    target: Object;
    propKey: symbol | string;
    listenerMetaKey: symbol;
}

export type SessionContextConstructor = Constructor<ISessionContext>

export interface MiddlewareHandler {
    reject (ctx: Context): boolean | Promise<boolean>
}

export interface NextMiddleware {
    next?: MiddlewareHandlerConstructor
}

export interface Middlewares {
    middlewares?: Constructor<MiddlewareHandler>[]
}

export interface HandlerData extends Middlewares {}

export type MiddlewareHandlerConstructor = Constructor<MiddlewareHandler>