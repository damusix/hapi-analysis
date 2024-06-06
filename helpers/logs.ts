import C from 'chalk';
import { F } from 'ts-toolbelt';
import Hapi from '@hapi/hapi';

import { objHasAtleastOneKey, store } from '.';

export const { red, blue, magenta, yellow, green, gray, rgb, italic } = C;

const tab = (n = 1) => new Array(n * 3 - 1).fill(' ').join('');

const n = () => `${store.stepNo}.`.padEnd(4);
const space = (str: string = ' ') => str.padEnd(4);
const startTime = +new Date();
const time = () => gray(((+new Date() - startTime)/1000) + 's');

export const w = console.log;

export const _progress = {

    /**
     * Used to log the progress of the givens and throughout
     * the server lifecycle to log the progress of the server.
     */

    given(txt: string) {

        store.givenNo++;
        w(magenta(`${store.givenNo}. ${txt}`));
    },

    givenSkip(txt: string) {

        store.givenNo++;
        w(gray(`${store.givenNo}. [skip] ${txt}`));
    },

    test(txt: string) {

        store.testNo++;
        w(tab(), blue(`${store.testNo}. ${txt}`));
    },

    testSkip(txt: string) {

        store.testNo++;
        w(tab(), gray(`${store.testNo}. [skip] ${txt}`));
    },

    srvExt(ext: Hapi.ServerExtType, ...args: any[]) {

        store.stepNo++;
        w(tab(2), n(), magenta(`[ext]`), ext, ...args, time());
    },

    reqExt(ext: Hapi.ServerRequestExtType, ...args: any[]) {

        store.stepNo++;
        w(tab(2), n(), yellow(`[ext]`), ext, ...args, time());
    },

    /**
     * Used inside the it functions by the developer to log the
     * progress of the test.
     */

    instruct(txt: string) {

        w(gray(`[instructions]`), txt);
    },

    badUsage(txt: string) {

        w(red(`[usage]`), txt);
    },

    pause(txt: string) {

        w(tab(), rgb(191, 67, 33)(`[pause]`), txt);
    },

    step(...args: Parameters<typeof w>) {

        store.stepNo++;
        w(tab(2), n(), green(`[step]`), ...args, time());
    },

    skip(...args: Parameters<typeof w>) {

        store.stepNo++;
        w(tab(2), n(), red(`[skip]`), ...args);
    },

    ignore(...args: Parameters<typeof w>) {

        w(tab(2), space(), gray(`[ignore]`), ...args);
    },

    err(...args: Parameters<typeof w>) {

        store.stepNo++;
        w(tab(2), n(), red(`[err]`), ...args, time());
    },

    event(name: string, tags: string[] = [], args: any = {}) {

        store.stepNo++;
        w(tab(2), n(), blue(`[event]`), name, tags, args, time());
    },

    log(...args: Parameters<typeof w>) {

        w(tab(2), space(), gray('[log]'), ...args);
    },

    _makeBulletsHof(colorFn: F.Function) {

        return function (obj: { [key: string]: any }, msg?: string) {

            if (msg) {

                w(tab(2), space('--'), colorFn(`[${msg}]`), time());
            }

            if (!obj) {

                w(tab(4), space(), colorFn('[no bullets]'));
                return;
            }

            /**
             * Recursively dump the keys of the object
             *
             * Note: This function is recursive and will only
             * go 3 levels deep. If the object is deeper than
             * that, it will be truncated.
             */
            const dumpKeys = (t: number, obj: { [key: string]: any }) => {

                if (t > 4 + (store.dumpKeysLevels * 2)) {
                    return;
                }


                for (const key in obj) {

                    let val = obj[key];
                    const isObj = typeof val === 'object';
                    const isArr = Array.isArray(val);

                    if (isObj) {

                        const hasKeys = objHasAtleastOneKey(val);

                        let msg = '{...}';

                        if (!hasKeys) {

                            msg = '{}';

                            if (val === null) {

                                msg = yellow('null');
                            }
                        }

                        val = gray(msg);
                    }

                    if (isArr) {
                        val = gray('[...]');
                    }

                    w(tab(t), space('>'), gray(key), colorFn(val));

                    if (isObj) {

                        dumpKeys(t + 2, obj[key]);
                    }
                }
            }

            dumpKeys(4, obj);
        }
    },

    comments(msgs: string[], t: number = 2) {

        for (const msg of msgs) {

            w(tab(t), space(), gray(`-`), rgb(181, 209, 165)(italic(msg)));
        }
    },

    respond(obj: { [key: string]: any }) {

        this.bulletSuccess(obj, 'response transmitted', time());
    },
};

export const log = {

    /**
     * Used to instruct the developer on what to do
     */
    instruct: _progress.instruct,

    /**
     * Used to log bad usage
     */
    badUsage: _progress.badUsage,

    /**
     * Used to pause the test
     */
    pause: _progress.pause,

    /**
     * Used to log the progress of the givens and throughout
     */
    step: _progress.step,

    /**
     * Use to log a skipped message
     */
    skip: _progress.skip,

    /**
     * Used to log an ignore message
     */
    ignore: _progress.ignore,

    /**
     * Used to log an error
     */
    err: _progress.err,

    /**
     * Generic log
     */
    log: _progress.log,

    /**
     * Used to log an event
     */
    event: _progress.event,

    /**
     * Logs an object as bullets
     */
    bulletSuccess: _progress._makeBulletsHof(green),
    bulletFail: _progress._makeBulletsHof(red),
    bulletInfo: _progress._makeBulletsHof(blue),

    /**
     * Used to log a response
     */
    respond: _progress.respond,

    /**
     * Used to log comments
     */
    comments: _progress.comments,
}
