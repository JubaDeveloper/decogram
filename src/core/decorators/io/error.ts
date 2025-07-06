import { LoggerFactory } from "../../logger/logger.factory";
import { classErrorHandlerKey, methodErrorHandlerKey } from "../../metadata/keys";
import { ErrorHandler, Constructor } from "../../types/types";

const logger = LoggerFactory().getDefaultLogger()

export const ClassErrorHandler = (handler: ErrorHandler) => {
	logger.trace("[ClassErrorHandler Decorator]");

	return <T extends Constructor>(target: T) => {
		Reflect.defineMetadata(classErrorHandlerKey, handler, target);
	};
};

export const MethodErrorHandler = (handler: ErrorHandler): MethodDecorator => {
	logger.trace("[MethodErrorHandler Decorator] Registering handler for method.");

	return (target, propKey) => {
		logger.debug(`[MethodErrorHandler] target=${String(propKey)} handler registered.`);

		Reflect.defineMetadata(methodErrorHandlerKey, handler, target, propKey);
	};
};
