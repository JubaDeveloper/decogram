import { LoggerFactory } from "../../logger/logger.factory";
import { DefineListenerMetadata } from "../../types/types";
import { contextPredicateMetaKey } from "../keys";

const logger = LoggerFactory().getDefaultLogger()

export const defineMethodListenerMetadatas = ({ predicates, target, propKey, listenerMetaKey }: DefineListenerMetadata) => {
    logger.trace(`[defineMethodListenerMetadatas] Registering method=${String(propKey)} with key=${String(listenerMetaKey.description)}`);
    Reflect.defineMetadata(contextPredicateMetaKey, predicates, target, propKey);
    const onMessageMethods = Reflect.getMetadata(listenerMetaKey, target) ?? [];
    onMessageMethods.push(propKey);
    Reflect.defineMetadata(listenerMetaKey, onMessageMethods, target);
};