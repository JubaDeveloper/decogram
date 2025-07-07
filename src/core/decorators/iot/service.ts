import "reflect-metadata";
import { serviceMetaKeySymbol } from "decogram@core/metadata/keys";
import { Constructor } from "../../types/types";
import { Component } from "./component";

/**
 * Service decorator aliases Component to mark singleton injectable
 */
export const Service = <T extends Constructor>(target: T): T => {
	Reflect.defineMetadata(
		serviceMetaKeySymbol,
		target,
		target
	)

	return Component(target);
};
