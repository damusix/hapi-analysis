import C from 'chalk';;

/**
 * Extends the javascript array prototype for easier manipulation
 *
 * We use an underscore to communicate that this is a custom method
 * and not a native method. This is not performant, nor recommended
 * for production code, but it is used here to avoid the need to
 * install more libraries. This repo is purely for educational purposes
 * anyway and not for production use.
 */
declare global {

    interface Array<T> {

        /**
         * Inserts items into the array at the specified index
         */
        _insert(index: number, ...items: T[]): T[];

        /**
         * Removes an item from the array
         */
        _remove(item: T): T[];

        /**
         * Picks the selected items from the array
         */
        _pick(...items: T[]): T[];

        /**
         * Omits the selected items from the array
         */
        _omit(...items: T[]): T[];
    }

    /**
     * Used to trace when process.exit is called
     */
    const traceExit: () => void

    /**
     * Used to log debug messages
     */
    const logDbg: (...msg: any) => void
}

Object.defineProperty(Array.prototype, '_insert', {
    enumerable: false,
    value: function (index, ...items) {

        return this.slice(0, index).concat(
            items,
            this.slice(index)
        )
    }
});

Object.defineProperty(Array.prototype, '_remove', {
    enumerable: false,
    value: function (item) {

        const index = this.indexOf(item);

        if (index === -1) {
            return this;
        }

        return this.slice(0, index).concat(
            this.slice(index + 1)
        );
    }
});

Object.defineProperty(Array.prototype, '_pick', {
    enumerable: false,
    value: function (...items) {

        return this.filter(
            item => items.includes(item)
        );
    }
});

Object.defineProperty(Array.prototype, '_omit', {
    enumerable: false,
    value: function (...items) {

        return this.filter(
            item => !items.includes(item)
        );
    }
});


const _global = globalThis as any;

_global.traceExit = () => {

    const originalExit = process.exit;

    process.exit = (code?: number | string | null) => {

        console.trace('exit called')

        return originalExit(code);
    };
}

_global.logDbg = (...args: any[]) => {

    console.log(C.gray('------------------'))
    console.log(C.bgMagenta('DEBUG'), ...args)
    console.log(C.gray('------------------'))
}

export {}