declare global {

    interface Array<T> {

        /**
         * Inserts items into the array at the specified index
         */
        insert(index: number, ...items: T[]): T[];
    }
}

Object.defineProperty(Array.prototype, 'insert', {
    enumerable: false,
    value: function (index, ...items) {

        return this.slice(0, index).concat(
            items,
            this.slice(index)
        )
    }
});


export {}