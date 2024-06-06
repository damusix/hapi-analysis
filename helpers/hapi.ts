import C from 'chalk';
import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';

import {
    log,
    gray,
    store,
    _progress,
    stepper,
} from '.';

type HookToExtTypes = (
    Hapi.ServerExtType |
    Hapi.ServerRequestExtType |
    '_handler' | '_authenticate' | '_authenticatePayload'
);

/**
 * Set of extension points that should throw an error
 */
export const throwErrorOn: Set<HookToExtTypes> = new Set();

/**
 * Set of extension points that should return an error
 */
export const returnErrorOn: Set<HookToExtTypes> = new Set();

/**
 * Set of extension points that should be ignored
 */
export const ignoreExt: Set<HookToExtTypes> = new Set();

/**
 * Generic fail action for the server
 * Logs and returns the error
 */
export const mkFailAction: (

    (msg?: string | false) => Hapi.Lifecycle.Method<any>
 ) = (msg) => (

    async (request, h, err?: Error) => {

        if (msg !== false) {
            await stepper.next(msg || 'Fail action is next');
        }

        const notFromEvent = !!h;

        let _return: any;

        const mightReturn = (val: any) => {

            if (notFromEvent) {

                _return = val;
            }
        }

        if (err) {

            log.err('Error caught in fail action:', err.message);

            mightReturn(err);
        }

        const boom = request.response as Boom.Boom;

        if (boom.isBoom) {

            log.err('Response is a boom');

            log.bulletFail({
                method: request.method,
                path: request.path,
                msg: boom.message,
                code: boom.output.statusCode,
                isServer: boom.isServer,
                isDeveloper: (boom as any).isDeveloper,
            })

            mightReturn(request.response);
        }
        else {

            mightReturn(h?.continue);
        }

        return _return;
    }
 );

/**
 * Generic return values for the handler
 */
const success = true;
const ignored = true;

/**
 * Generic handler for the server
 *
 * Implements a custom hook using the store object. Overwriting
 * the _handler property in the store object will allow for
 * custom handler logic.
 *
 * The handler will log the path of the request and call the
 * custom handler if it exists. Otherwise, it will return the
 * generic success value.
 *
 * If the ignoreExt set contains '_handler', the handler will
 * return the generic ignored value. Nothing will be logged.
 *
 * If the throwErrorOn set contains '_handler', the handler will
 * log an error and throw an error.
 *
 * If the returnErrorOn set contains '_handler', the handler will
 * log an error and return an error.
 */
export const handler: Hapi.Lifecycle.Method = async (request, h) => {


    if (ignoreExt.has('_handler')) {

        log.ignore('_handler');
        return { ignored };
    }

    await stepper.next('Handler call is next');

    if (throwErrorOn.has('_handler')) {

        log.err('_handler');
        throw new Error('thrown error on handler');
    }

    if (returnErrorOn.has('_handler')) {

        log.err('_handler');
        return new Error('returned error on handler');
    }


    log.step('handler', gray(request.path));

    if (store._handler) {

        return await store._handler(request, h);
    }

    return { success };
};

/**
 * Generic extension point generator for the server.
 * Returns a tuple with the extension point and a function
 * that will call the corresponding function in the store
 * object.
 *
 * If the ignoreExt set contains the extension point, the
 * function will return without calling the store function.
 * Nothing will be logged.
 *
 * If the throwErrorOn set contains the extension point, the
 * function will log an error and throw an error.
 *
 * If the returnErrorOn set contains the extension point, the
 * function will log an error and return an error.
 *
 * If the store object contains the extension point, the
 * function will call the corresponding function in the store
 * object.
 */
export const mkSrvExt: (
    ext: Hapi.ServerExtType
) => [Hapi.ServerExtType, Hapi.ServerExtPointFunction] = (

    (ext) => [
        ext,
        async (srv) => {

            if (ignoreExt.has(ext)) {

                log.ignore(ext);
                return;
            }

            await stepper.next(`Server extension point ${ext} is next`);

            if (throwErrorOn.has(ext)) {

                log.err(ext);
                throw new Error(`thrown error on ${ext}`);
            }

            if (returnErrorOn.has(ext)) {

                log.err(ext);
                return new Error(`returned error on ${ext}`);
            }

            _progress.srvExt(ext);

            if (store[ext]) {

                return await store[ext]!(srv);
            }

            return;
        }
    ]
);

/**
 * Generic extension point generator for the server.
 *
 * Returns a tuple with the extension point and a function
 * that will call the corresponding function in the store
 * object.
 *
 * If the ignoreExt set contains the extension point, the
 * function will return without calling the store function.
 * Nothing will be logged.
 *
 * If the throwErrorOn set contains the extension point, the
 * function will log an error and throw an error.
 *
 * If the returnErrorOn set contains the extension point, the
 * function will log an error and return an error.
 *
 * If the store object contains the extension point, the
 * function will call the corresponding function in the store
 * object.
 */
export const mkReqExt: (
    ext: Hapi.ServerRequestExtType
) => [Hapi.ServerRequestExtType, Hapi.Lifecycle.Method] = (

    (ext) => [
        ext,
        async (req, h) => {

            if (ignoreExt.has(ext)) {

                log.ignore(ext);
                return h.continue;
            }

            await stepper.next(`Request extension point ${ext} is next`);

            if (throwErrorOn.has(ext)) {

                log.err(ext);
                throw new Error(`thrown error on ${ext}`);
            }

            if (returnErrorOn.has(ext)) {

                log.err(ext);
                return new Error(`returned error on ${ext}`);
            }

            _progress.reqExt(ext);

            if (store[ext]) {

                return store[ext]!(req, h);
            }


            return h.continue
        }
    ]
);


/**
 * Makes a config for a route extension point
 */
export const makeExtForRoute = (ext: Hapi.ServerRequestExtType) => {

    const method = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {

        /**
         * If the store does not have a function for this extension point,
         * we return without doing anything
         */
        if (!store.routeExt[ext]) {
            return h.continue;
        }

        // Get the route path and method
        const from = request.route.method + ' ' + request.route.path;

        await stepper.next(`Route extension point ${ext} is next from ${from}`);

        // Log the step
        _progress.reqExt(ext, from);

        /**
         * If the store has a function for this extension point,
         * we call it
         */
        return await store.routeExt[ext]!(request, h);
    }

    return { method }
}
