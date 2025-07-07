import { Service } from "decogram@core/decorators/iot/service";
import { SingletonService } from "decogram@core/singleton/singleton";
import { Autowired } from "decogram@core/decorators/iot/autowired";

describe("Dependency Injection", () => {
	test("Should create one service and inject it and expect it to be available", () => {
		@Service
		class MyService {}

		@Service
		class Test {
			constructor(@Autowired private readonly myService: MyService) {}

			public getMyService() {
				return this.myService;
			}
		}

		const test = SingletonService.loadClassInstance(Test);

		expect(test.getMyService()).not.toBe(undefined);
	});

	test("Should inject multiple services", () => {
		@Service class ServiceA {}

		@Service class ServiceB {}

		@Service
		class MultiDep {
			constructor(
				@Autowired private readonly a: ServiceA,
				@Autowired private readonly b: ServiceB
			) {}

			public getDeps() {
				return [this.a, this.b];
			}
		}

		const instance = SingletonService.loadClassInstance(MultiDep);

		const [a, b] = instance.getDeps();

		expect(a).toBeInstanceOf(ServiceA);

		expect(b).toBeInstanceOf(ServiceB);
	});

	test("Should keep a single instance of a service", () => {
		@Service class Singleton {}

		const a = SingletonService.loadClassInstance(Singleton);

		const b = SingletonService.loadClassInstance(Singleton);

		expect(a).toBe(b);
	});

	test("Should inject nested dependencies", () => {
		@Service class Level1 {}

		@Service class Level2 {
			constructor(@Autowired public l1: Level1) {}
		}

		@Service class Level3 {
			constructor(@Autowired public l2: Level2) {}
		}

		const instance = SingletonService.loadClassInstance(Level3);

		expect(instance.l2).toBeInstanceOf(Level2);

		expect(instance.l2.l1).toBeInstanceOf(Level1);
	});

	test("Should fail when dependency is not a service", () => {
		class NotAService {
			public someMethod () {
				// Do something
			}
		}

		@Service
		class NeedsIt {
			constructor(@Autowired public dep: NotAService) {}
		}

		const instance = SingletonService.loadClassInstance(NeedsIt)

		expect(() => instance.dep.someMethod()).toThrow();
	});

	test("Service method should call another service", () => {
		@Service
		class Logger {
			public log(msg: string) {
				return `Logged: ${msg}`;
			}
		}

		@Service
		class App {
			constructor(@Autowired private logger: Logger) {}

			public start() {
				return this.logger.log("hello");
			}
		}

		const app = SingletonService.loadClassInstance(App);

		expect(app.start()).toBe("Logged: hello");
	});
});
