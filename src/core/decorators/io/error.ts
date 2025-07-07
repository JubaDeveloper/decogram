import "reflect-metadata";
import { LoggerFactory } from "../../logger/logger.factory";
import { errorHandlerMetaKey } from "../../metadata/keys";
import { Constructor, TErrorHandler } from "../../types/types";

const logger = LoggerFactory().getDefaultLogger()

export const ErrorHandler = (handler: TErrorHandler) => {
	logger.trace("[ErrorHandler Decorator]");

	return <T extends Constructor | Object>(
		target: T, 
		propKey?: symbol | string,
		_descriptor?: TypedPropertyDescriptor<unknown>
	) => {
		Reflect.defineMetadata(errorHandlerMetaKey, handler, target, propKey);
	};
}