import { LoggerFactory } from "../../logger/logger.factory";
import { defineMethodListenerMetadatas } from "../../metadata/definers/defineMethodListenerMetadata";
import { onMessageMetaKey, onCallbackMetaKey } from "../../metadata/keys";
import { ContextPredicate, TgMessageContext, TgCallbackQueryContext } from "../../types/types";

const logger = LoggerFactory().getDefaultLogger()

export const OnMessage = (predicates: ContextPredicate<TgMessageContext>[] = []): MethodDecorator => {
    logger.trace(`[OnMessage Decorator] predicates.length=${predicates.length}`);
    return (target, propKey) => {
        defineMethodListenerMetadatas({ predicates, target, propKey, listenerMetaKey: onMessageMetaKey });
    };
};

export const OnCallbackQuery = (predicates: ContextPredicate<TgCallbackQueryContext>[] = []): MethodDecorator => {
    logger.trace(`[OnCallbackQuery Decorator] predicates.length=${predicates.length}`);
    return (target, propKey) => {
        defineMethodListenerMetadatas({ predicates, target, propKey, listenerMetaKey: onCallbackMetaKey });
    };
};

export const OnClick = (buttonData: string) => {
    logger.trace(`[OnClick Decorator] buttonData=${buttonData}`);
    return OnCallbackQuery([
        (ctx) => ctx.callbackQuery.data === buttonData
    ]);
};

export const OnCommand = (command: string): MethodDecorator => {
    logger.trace(`[OnCommand Decorator] command=${command}`);
    return OnMessage([
        (ctx) => (ctx.message as any)?.text?.trim()?.startsWith(command)
    ]);
};

export const OnAnything: MethodDecorator = OnMessage([() => true]);
