declare module 'better-sqlite3' {
  import { EventEmitter } from 'events';

  interface RunResult {
    changes: number;
    lastInsertRowid: number;
  }

  interface PrepareOptions {
    cache?: boolean;
  }

  export class Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): IterableIterator<any>;
    pluck(toggleState?: boolean): this;
    expand(toggleState?: boolean): this;
    bind(...params: any[]): this;
    safeIntegers(toggleState?: boolean): this;
    returnsData(toggleState?: boolean): this;
  }

  export class Database extends EventEmitter {
    constructor(filename: string, options?: { readonly?: boolean; fileMustExist?: boolean; timeout?: number; verbose?: ((message?: any, ...additionalArgs: any[]) => void) | null });
    prepare(source: string, options?: PrepareOptions): Statement;
    exec(source: string): this;
    pragma(source: string, options?: { simple?: boolean }): any;
    checkpoint(databaseName?: string): this;
    function(name: string, options?: { varargs?: boolean; deterministic?: boolean; directOnly?: boolean }, callback: (...params: any[]) => any): this;
    aggregate(name: string, options: { start: any; step: (current: any, next: any) => any; inverse?: (current: any, old: any) => any; result: (current: any) => any; varargs?: boolean; deterministic?: boolean; directOnly?: boolean }): this;
    loadExtension(path: string, entryPoint?: string): this;
    close(): this;
    defaultSafeIntegers(toggleState?: boolean): this;
    backup(destination: string | Database, options?: { progress?: (progress: { totalPages: number; remainingPages: number }) => void | boolean }): Promise<void>;
    serialize(options?: { attach?: string; name?: string }): Buffer;
    isOpen: boolean;
    inTransaction: boolean;
    name: string;
    memory: boolean;
    readonly: boolean;
    userVersion: number;
  }

  export = Database;
}

