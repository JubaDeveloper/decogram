import { LoggerFactory } from "../../logger/logger.factory";

const logger = LoggerFactory().getDefaultLogger()

export const defineParamMetadata = (target: object, propKey: symbol | string, paramIndex: number, metaKey: symbol) => {
	logger.trace(`[defineParamMetadata] Adding metadata: target=${String(propKey)}, index=${paramIndex}, key=${String(metaKey.description)}`);

	const messageMetadata = Reflect.getMetadata(metaKey, target, propKey) ?? [];

	messageMetadata.push(paramIndex);

	Reflect.defineMetadata(metaKey, messageMetadata, target, propKey);
};