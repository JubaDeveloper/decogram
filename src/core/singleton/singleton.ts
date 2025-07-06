type Constructor<T = any> = new (...args: any[]) => T

interface InstancePerArgs <T = any> {
  args: string
  instance: T
}

type InstanceCreatePredicate <T> = () => Promise<T>

export class SingletonService {
	private static instancesPerArg = new Set<InstancePerArgs>()
	private static instances = new Set<Object>();

	public static loadClassInstance<T>(target: Constructor<T>): T {
		for (const instance of this.instances) {
			if (instance.constructor === target) return instance as T;
		}

		const instance = new target();

		this.instances.add(instance);

		return instance;
	}

	public static async loadClassInstancePerArgsOrEvalPredicate <T = unknown> (
		args: string,
		predicate: InstanceCreatePredicate<T>
	): Promise<T>{
		for (const instance of this.instancesPerArg) {
			if (instance.args === args) return instance.instance as T;
		}

		const instance = await predicate()

		this.instances.add(instance)

		return instance
	}
}