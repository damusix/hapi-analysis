import Hapi from '@hapi/hapi';
import HapiRequest from '@hapi/hapi/lib/request';
import HapiResponse from '@hapi/hapi/lib/response';

import Joi from 'joi';
import { O } from 'ts-toolbelt';

import {
    failAction,
    store,
    mkSrvExt,
    mkReqExt,
    handler,
    log,
    _progress,
    ignoreExt,
    makeExtForRoute
} from '.';

export const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
        validate: { failAction },
        payload: { failAction },
        response: { failAction },
        state: { failAction },
    }
});

/**
 * Events exactly as defined in hapijs/hapi/lib/core.js
 */
const events = [
    { name: 'cachePolicy', spread: true },
    { name: 'log', channels: ['app', 'internal'], tags: true },
    { name: 'request', channels: ['app', 'internal', 'error'], tags: true, spread: true },
    'response',
    'route',
    'start',
    'closing',
    'stop'
];

/**
 * We iterate through the events and add listeners to the server.
 * This allows us to log the events as they happen and visualize
 * the server entire lifecycle
 */
for (const event of events) {

    const listener = (..._args: any[]) => {

        /**
         * If the event is a string, we log it as is
         */
        if (typeof event === 'string') {

            /**
             * Special case for the route event
             */
            if (event === 'route') {

                const route = _args[0];

                const path = `${route.method} ${route.path}`

                log.event('route', [], { path });
                return;
            }

            /**
             * Special case for the response event
             */
            if (event === 'response') {

                const req = _args[0] as Hapi.Request;

                if (req instanceof HapiRequest) {

                    const res = req.response as Hapi.ResponseObject;

                    const path = `${req.route.method} ${req.route.path}`

                    log.event('response', [], `${res.statusCode} ${path}`);
                    return;
                }

                log.event('response', []);
                return;
            }

            log.event(event);
            return;
        }

        /**
         * If the event is an object, we will extract relevant information
         * and log it accordingly. Request and cache policy events, for given,
         * are spread events, meaning they have multiple arguments. We will
         * pull what's relevant and log it.
         */

        const arg = _args[0];
        const reqInfo = _args[1];
        const _tags = _args[2];

        let args: string[] = [];
        let tags: O.Object | null = _tags || null;
        let channels = event.channels || [];

        if (arg instanceof Error) {

            args = [`error ${arg.message}`];
        }

        if (arg instanceof HapiRequest) {

            args = [`request ${arg.path}`];
        }

        if (reqInfo) {

            channels = [reqInfo.channel];
        }

        log.event(event.name, channels, { args });

        if (reqInfo && reqInfo.request) {

            log.bulletInfo(reqInfo, 'event request');
        }

        if (tags) {

            log.bulletInfo(tags, 'event tags');
        }
    }

    server.events.on(event, listener);
}

/**
 * Server extension points
 */
export const srvExts: Hapi.ServerExtType[] = [
    'onPreStart',
    'onPostStart',
    'onPreStop',
    'onPostStop',
];

/**
 * Request extension points
 */
export const reqExts: Hapi.ServerRequestExtType[] = [
    'onRequest',
    'onPreAuth',
    'onCredentials',
    'onPostAuth',
    'onPreHandler',
    'onPostHandler',
    'onPreResponse',
    'onPostResponse',
];

given.always('A server is prepared', () => {

    it('adds a custom auth scheme', () => {

        /**
         * We add a custom auth scheme to the server. This will allow us
         * to test how the server handles authentication scenarios.
         */
        server.auth.scheme('custom', (server, options) => ({

            authenticate: async (request, h) => {

                if (ignoreExt.has('_authenticate')) {

                    return h.continue;
                }

                log.step('authenticate');

                /**
                 * If the store has a custom authenticate function,
                 * we call it
                 */
                if (store._authenticate) {

                    return store._authenticate(request, h);
                }

                /**
                 * If the store has an authArgument set, we return
                 * authenticated with the authArgument
                 */
                return h.authenticated(store.authArgument!);
            },
            payload: async (request, h) => {

                if (ignoreExt.has('_authenticatePayload')) {

                    return h.continue;
                }

                log.step('authenticate payload');

                /**
                 * If the store has a custom authenticatePayload function,
                 * we call it
                 */
                if (store._authenticatePayload) {

                    return store._authenticatePayload(request, h);
                }

                return h.continue;
            }
        }));

        server.auth.strategy('test', 'custom');
    });

    it('adds hooks', () => {

        for (const ext of srvExts) {

            server.ext(...mkSrvExt(ext));
        }

        for (const ext of reqExts) {

            server.ext(...mkReqExt(ext));
        }

        /**
         * We add a global fail action to the server. This will be used
         * to test how the server handles validation errors.
         *
         * If the test suite is set to throw an error on onPreResponse hook,
         * then this failAction will be ignored because the previous hook
         * above would have thrown an error.
         */
        server.ext('onPreResponse', failAction as Hapi.Lifecycle.Method);
    });

    it('adds routes', () => {

        /**
         * Generic, no auth route
         */
        server.route({
            method: 'GET',
            path: '/',
            handler,
        });

        /**
         * Auth route
         */
        server.route({
            method: 'GET',
            path: '/auth',
            handler,
            options: {
                auth: {
                    strategy: 'test',
                }
            }
        });

        /**
         * Route with validation
         */
        server.route({
            method: 'POST',
            path: '/validation/{param?}',
            handler,
            options: {
                auth: {
                    strategy: 'test',
                    payload: 'required'
                },
                validate: {
                    payload: Joi.object({
                        payload: Joi.string().required(),
                    }),
                    query: Joi.object({
                        query: Joi.string().required(),
                    }),
                    params: Joi.object({
                        param: Joi.string().required(),
                    }),
                    state: Joi.object({
                        state: Joi.string().required(),
                    }),
                }
            }
        });

        /**
         * Route with authentication and extension points
         */
        server.route({
            method: 'GET',
            path: '/auth/ext',
            handler,
            options: {
                auth: {
                    strategy: 'test',
                },
                ext: {
                    onPreAuth: makeExtForRoute('onPreAuth'),
                    onCredentials: makeExtForRoute('onPreAuth'),
                    onPostAuth: makeExtForRoute('onPreAuth'),
                    onPreHandler: makeExtForRoute('onPreAuth'),
                    onPostHandler: makeExtForRoute('onPreAuth'),
                    onPreResponse: makeExtForRoute('onPreAuth'),
                    onPostResponse: makeExtForRoute('onPreAuth'),
                }
            }
        });

    });
})
