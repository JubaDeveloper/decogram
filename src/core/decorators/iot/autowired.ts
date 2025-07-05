import { autoWireMetaKeySymbol } from "../../metadata/keys";

/**
 * Autowired decorator marks constructor parameters for injection
 */
export const Autowired: ParameterDecorator = (target, _propertyKey, parameterIndex) => {
  // Store parameter indices to inject later
  const existingIndices: number[] = Reflect.getOwnMetadata(autoWireMetaKeySymbol, target) ?? [];
  existingIndices.push(parameterIndex);
  Reflect.defineMetadata(autoWireMetaKeySymbol, existingIndices, target);
};