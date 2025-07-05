// Import all core related modules
import * as types from "./core/types/types";
import * as telegramMounting from "./core/telegram/mounting/mounting";
import * as strategyPolling from "./core/strategy/polling";
import * as strategyWebhook from "./core/strategy/webhook";
import * as singleton from "./core/singleton/singleton";
import * as bootstrap from "./core/bootstrap/bootstrap";

// Group and export all core modules under 'core'
export const core = {
  ...types,
  telegramMounting,
  strategy: {
    polling: strategyPolling,
    webhook: strategyWebhook,
  },
  singleton,
  bootstrap,
};


// Import all io decorators
import * as ioClass from "./core/decorators/io/class";
import * as ioParameter from "./core/decorators/io/parameter";
import * as ioMethod from "./core/decorators/io/method";
import * as ioError from "./core/decorators/io/error";

// Group and export all io decorators under 'decorators.io'
export const decoratorsIo = {
  class: ioClass,
  parameter: ioParameter,
  method: ioMethod,
  error: ioError,
};


// Import all iot decorators
import * as iotAutowired from "./core/decorators/iot/autowired";
import * as iotComponent from "./core/decorators/iot/component";
import * as iotService from "./core/decorators/iot/service";

// Group and export all iot decorators under 'decorators.iot'
export const decoratorsIot = {
  autowired: iotAutowired,
  component: iotComponent,
  service: iotService,
};
