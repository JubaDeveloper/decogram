import "reflect-metadata";
import { autoWireMetaKeySymbol } from "../../metadata/keys";
import { SingletonService } from "../../singleton/singleton";
import { Constructor } from "../../types/types";

/**
 * Component decorator wraps class constructor to inject dependencies
 */
export const Component = <T extends Constructor>(target: T): T => {
	return class extends target {
		constructor(...args: any[]) {
			// Get constructor parameter indices that require autowiring
			const keys: number[] = Reflect.getMetadata(autoWireMetaKeySymbol, target) ?? [];

			// Get constructor parameter types metadata
			const paramTypes: any[] = Reflect.getMetadata("design:paramtypes", target) ?? [];

			// Inject singleton instances into args at specified positions
			for (const index of keys) {
				if (args[index]) continue

				args[index] = SingletonService.loadClassInstance(paramTypes[index]);
			}

			super(...args);
		}
	};
};