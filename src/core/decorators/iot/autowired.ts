import { autoWireMetaKeySymbol, serviceMetaKeySymbol } from "../../metadata/keys";

/**
 * Autowired decorator marks constructor parameters for injection
 */
export const Autowired: ParameterDecorator = (target, _propertyKey, parameterIndex) => {
	// Check if the target param is a service
	const paramsDesign = Reflect.getMetadata(
		"design:paramtypes",
		target
	) ?? []

	const targetParamType = paramsDesign[parameterIndex]

	if (!Reflect.getMetadata(serviceMetaKeySymbol, targetParamType)) return

	// Store parameter indices to inject later
	const existingIndices: number[] = Reflect.getOwnMetadata(autoWireMetaKeySymbol, target) ?? [];

	existingIndices.push(parameterIndex);

	Reflect.defineMetadata(autoWireMetaKeySymbol, existingIndices, target);
};