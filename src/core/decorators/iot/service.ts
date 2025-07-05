import { Constructor } from "../../types/types";
import { Component } from "./component";

/**
 * Service decorator aliases Component to mark singleton injectable
 */
export const Service = <T extends Constructor>(target: T): T => {
  return Component(target);
};
