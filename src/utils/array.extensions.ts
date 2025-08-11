declare global {
  interface Array<T> {
    containsDuplicates(): boolean;
    equals(arrayTarget: T[]): boolean;
    singleOrDefault(
      predicate?: (value: T, index: number, array: T[]) => boolean,
      defaultValue?: T,
    ): T | undefined;
  }
}

if (!Array.prototype.containsDuplicates) {
  Array.prototype.containsDuplicates = function <T>(this: Array<T>) {
    const uniqueSet = new Set(this);
    return this.length !== uniqueSet.size;
  };
  Array.prototype.equals = function <T>(this: Array<T>, arrayTarget: Array<T>) {
    const set1 = new Set(this);
    const set2 = new Set(arrayTarget);
    return set1.size === set2.size && [...set1].every((x) => set2.has(x));
  };
  Array.prototype.singleOrDefault = function <T>(
    this: T[],
    predicate?: (value: T, index: number, array: T[]) => boolean,
    defaultValue?: T,
  ): T | undefined {
    let matches: T[];

    if (predicate) {
      matches = this.filter(predicate);
    } else {
      matches = [...this];
    }

    if (matches.length === 1) {
      return matches[0];
    }
    return defaultValue; // Use provided default if not found or if multiple
  };
}

export {};
