import { LoggerFactory } from "../../logger/logger.factory";
import { defineParamMetadata } from "../../metadata/definers/defineParamMetadata";
import { messageMetaKey, sendMessageMetaKey, sessionContextMetaKey } from "../../metadata/keys";

const logger = LoggerFactory().getDefaultLogger()

export const Message: ParameterDecorator = (target, proKey, paramIndex) => {
	logger.trace(`[Message Decorator] target=${String(proKey)}, index=${paramIndex}`);

	defineParamMetadata(target, proKey, paramIndex, messageMetaKey);
};

export const SendMessage: ParameterDecorator = (target, proKey, paramIndex) => {
	logger.trace(`[SendMessage Decorator] target=${String(proKey)}, index=${paramIndex}`);

	defineParamMetadata(target, proKey, paramIndex, sendMessageMetaKey);
};

export const Session: ParameterDecorator = (target, proKey, paramIndex) => {
	logger.trace(`[Session Decorator] target=${String(proKey)}, index=${paramIndex}`);

	defineParamMetadata(target, proKey, paramIndex, sessionContextMetaKey);
};
