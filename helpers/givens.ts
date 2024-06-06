import Hoek from '@hapi/hoek'
import { _progress, gray, italic, stepper, store } from '.';

const _global = globalThis as any;


type TddFunc = () => void | Promise<void>;


/**
 * Used to store an given's test function
 */
class TddStoreTest {
    skip = false;
    only = false;
    always = false;
    func: TddFunc;

    constructor (func: TddFunc = Hoek.ignore) {

        this.func = func;
    }
}

/**
 * Used to store the given function
 *
 * An given is a group of tests that are used to inspect
 * and log the behavior of the hapi server.
 */
class TddInstance {

    func: TddFunc;
    skip = false;
    only = false;
    always = false;

    before: Set<TddFunc> = new Set();
    after: Set<TddFunc> = new Set();

    beforeEach: Set<TddFunc> = new Set();
    afterEach: Set<TddFunc> = new Set();

    tests: Map<string, TddStoreTest> = new Map();

    constructor (func: TddFunc = Hoek.ignore) {

        this.func = func;
    }
}

/**
 * Typings to support global functions
 */


interface it {
    (txt: string, func: TddStoreTest['func']): void;
    skip: (txt: string, func: TddStoreTest['func']) => void;
    only: (txt: string, func: TddStoreTest['func']) => void;
    always: (txt: string, func: TddStoreTest['func']) => void;
}

interface given {
    (txt: string, func: TddFunc): void;
    skip: (txt: string, func: TddFunc) => void;
    only: (txt: string, func: TddFunc) => void;
    always: (txt: string, func: TddFunc) => void;
}

declare global {

    const it: it;
    const given: given;
    const rungivens: () => Promise<void>;

    const before: (func: TddFunc) => void;
    const after: (func: TddFunc) => void;
    const beforeEach: (func: TddFunc) => void;
    const afterEach: (func: TddFunc) => void;

    namespace NodeJS {

        interface Global {
            it: it;
            given: given;
            rungivens: () => Promise<void>;
            before: (func: TddFunc) => void;
            after: (func: TddFunc) => void;
            beforeEach: (func: TddFunc) => void;
            afterEach: (func: TddFunc) => void;
        }
    }
}

/**
 * Used to reset the global functions to their default values
 *
 * Each given function will set the global functions to their
 * own values. This function is used to reset the global functions
 * to their default values.
 */

const _it = Hoek.ignore as it;
_it.skip = Hoek.ignore as it['skip']
_it.only = Hoek.ignore as it['only']
_it.always = Hoek.ignore as it['always']

const resetGlobals = () => {

    _global.it = _it;
    _global.before =  Hoek.ignore;
    _global.after =  Hoek.ignore;
    _global.beforeEach =  Hoek.ignore;
    _global.afterEach =  Hoek.ignore;
}

resetGlobals();

/**
 * Used to store given functions
 */
const _givens = new Map<string, TddInstance>();

function given (txt: string, func: () => void | Promise<void>) {

    _givens.set(txt, new TddInstance(func));
}

given.skip = async (txt: string) => {

    const instance = new TddInstance();
    instance.skip = true;

    _givens.set(txt, instance);
}

given.only = async (txt: string, func: TddFunc) => {

    const instance = new TddInstance(func);
    instance.only = true;

    _givens.set(txt, instance);
}

given.always = async (txt: string, func: TddFunc) => {

    const instance = new TddInstance(func);
    instance.always = true;

    _givens.set(txt, instance);
}

/**
 * This function will run each function in a set
 *
 * Used to run the before, after, beforeEach, and afterEach
 */
const runEachFunc = async (set: Set<TddFunc>) => {

    for (const func of set) {

        await func();
    }
}

/**
 * This function will run all the givens
 *
 * It will run each given function and all the test functions
 * within each given.
 */
async function rungivens () {

    /**
     * Used to store the givens that are marked as only
     */
    const exOnlies = new Set(
        [..._givens.entries()]
            .filter(([,{ only }]) => only)
            .map(([txt]) => txt)
    )

    /**
     * Used to store the givens that are marked as always
     */
    const exAlways = new Set(
        [..._givens.entries()]
            .filter(([,{ always }]) => always)
            .map(([txt]) => txt)
    )


    for (const [txt, instance] of _givens) {


        // track the current test number
        store.testNo = 0;

        /**
         * If there are givens that are marked as only
         * and this given is not one of them, then skip
         * this given.
         */
        if (exOnlies.size && !exOnlies.has(txt)) {

            instance.skip = true;
        }

        /**
         * If there are givens that are marked as always
         * and this given is one of them, then do not skip
         * this given.
         */
        if (exAlways.has(txt)) {

            instance.skip = false;
        }

        const { skip, func, tests: steps } = instance;

        if (skip) {

            _progress.givenSkip(txt);
            continue;
        }

        /**
         * This function is used to store test functions
         */
        const it = function (txt: string, func: TddStoreTest['func']) {

            const instance = new TddStoreTest(func);

            steps.set(txt, instance);
        }

        it.skip = async (txt: string) => {

            const instance = new TddStoreTest();
            instance.skip = true;

            steps.set(txt, instance);
        }

        it.only = async (txt: string, func: TddStoreTest['func']) => {

            const instance = new TddStoreTest(func);
            instance.only = true;

            steps.set(txt, instance);
        }

        it.always = async (txt: string, func: TddStoreTest['func']) => {

            const instance = new TddStoreTest(func);
            instance.always = true;

            steps.set(txt, instance);
        }

        /**
         * These functions are used to store before, after,
         * beforeEach, and afterEach functions
         */


        const before = async (func: TddFunc) => {

            instance.before.add(func);
        };

        const after = async (func: TddFunc) => {

            instance.after.add(func);
        };

        const beforeEach = async (func: TddFunc) => {

            instance.beforeEach.add(func);
        };

        const afterEach = async (func: TddFunc) => {

            instance.afterEach.add(func);
        };

        /**
         * Set the global functions to the functions defined
         */
        _global.before = before;
        _global.after = after;
        _global.beforeEach = beforeEach;
        _global.afterEach = afterEach;
        _global.it = it;


        /**
         * Run the given function
         */
        await func();

        _progress.given(txt);

        /**
         * Run the before functions
         */
        await runEachFunc(instance.before);



        /**
         * Used to store the test functions that are marked as only
         */
        const testOnlies = new Set(
            [...steps.entries()]
                .filter(([,{ only }]) => only)
                .map(([txt]) => txt)
        )

        /**
         * Used to store the test functions that are marked as always
         */
        const testAlways = new Set(
            [...steps.entries()]
                .filter(([,{ always }]) => always)
                .map(([txt]) => txt)
        )


        for (const [txt, _test] of steps) {


            /**
             * If there are test functions that are marked as only
             * and this test function is not one of them, then skip
             * this test function.
             */
            if (testOnlies.size && !testOnlies.has(txt)) {

                _test.skip = true;
            }

            /**
             * If there are test functions that are marked as always
             * and this test function is one of them, then do not skip
             * this test function.
             */
            if (testAlways.has(txt)) {

                _test.skip = false;
            }

            const { func } = _test;

            // reset the step number
            store.stepNo = 0;

            if (_test.skip) {

                _progress.testSkip(txt);
                continue;
            }

            // Wait for the user to request next step
            // if the --step flag is present
            await stepper.next(
                'Next step: ' +
                gray(italic(txt))
            );

            // log the test number
            _progress.test(txt);

            /**
             * Run the beforeEach functions
             */
            await runEachFunc(instance.beforeEach);

            /**
             * Run the test function
             */
            await func();

            // Finish pending requests so they do not interfere with
            // the next test because Hapi continues to process requests
            // after the previous request has been transmitted.
            await stepper.finishRequests();

            /**
             * Run the afterEach functions
             */
            await runEachFunc(instance.afterEach);

            stepper.emit('next-scenario');

        }

        /**
         * Run the after functions
         */
        await runEachFunc(instance.after);

        /**
         * Reset the global functions to their default values
         */
        resetGlobals();
    }


    await stepper.done();
}


_global.given = given;
_global.rungivens = rungivens;

