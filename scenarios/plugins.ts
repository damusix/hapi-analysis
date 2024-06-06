import { O } from 'ts-toolbelt';
import Hapi from '@hapi/hapi';
import Joi from 'joi';

import {
    server,
    reqExts,
    store,
    returnErrorOn,
    throwErrorOn,
    log,
    ignoreExt,
} from '../helpers';


given('Route with no auth', async () => {

    beforeEach(async () => {

        store.authArgument = null;

        returnErrorOn.clear();
        throwErrorOn.clear();
    });

    it('doesnt throw errors on route without auth', async () => {

        const res = await server.inject({ method: 'GET', url: '/' });

        log.respond(res.result!);
    });

    const _exts1 = Array.from(reqExts)._insert(2, '_handler' as any)

    for (const ext of _exts1) {

        it(`returns error on ${ext}`, async () => {

            returnErrorOn.add(ext);

            const res = await server.inject({ method: 'GET', url: '/' });

            log.respond(res.result!);
        });
    }
});

given('Route with auth', async () => {

    after(async () => {

        ignoreExt.clear();
    });

    beforeEach(async () => {

        store.authArgument = {
            credentials: {
                name: 'john',
                scope: ['admin']
            }
        };

        returnErrorOn.clear();
        store.restore();
    })

    it('doesnt throw errors on route with auth', async () => {

        const res = await server.inject({ method: 'GET', url: '/auth' });

        log.respond(res.result!);
    });

    const _exts2 = Array.from(reqExts).splice(1, 3);

    for (const ext of _exts2) {

        it(`returns error on ${ext}`, async () => {

            returnErrorOn.add(ext);

            const res = await server.inject({ method: 'GET', url: '/auth' });

            log.respond(res.result!);
        });
    }

})

given('Route with auth and validation', async () => {

    /**
     * Sends a request to the server with the given options
     * so that we can test the validation of the request
     */
    const sendIt = (
        opts: Partial<
            Record<
                'payload' | 'query' | 'params' | 'cookie',
                O.Object
            >
        >
    ) => {

        const {
            payload,
            query,
            params,
            cookie
        } = opts;

        /**
         * The url to send the request to.
         *
         * By itself, this will fail because the route requires
         * a param to be passed in the url
         */
        let url = `/validation`;

        // If there are params, we add them to the url
        if (params) {

            url += `/${params.param}`;
        }

        // If there are query params, we add them to the url
        if (query) {

            url += '?';
            url += new URLSearchParams(query).toString();
        }

        // The options to send to the server
        const injectOpts: Hapi.ServerInjectOptions = {
            method: 'POST',
            url,
        };

        // If there is a payload, we add it to the options
        if (payload) {

            injectOpts.payload = payload;
        }

        // If there is a cookie, we add it to the options
        if (cookie) {

            injectOpts.headers = {
                cookie: new URLSearchParams(cookie).toString()
            };
        }

        return server.inject(injectOpts);
    }

    before(() => {

        // We only want to see the first 3 keys of the store
        store.dumpKeysLevels = 1;

        // We set the auth argument to be used in the auth scheme
        store.authArgument = {
            credentials: {
                name: 'john',
                scope: ['admin']
            }
        }
    });

    after(() => {

        // We restore the store to its original state
        store.dumpKeysLevels = 3;
    });

    afterEach(() => {

        store.restore();
    });

    it('validates the request payload', async () => {

        /**
         * We send a request to the server with a payload that
         * matches the validation schema of the route. This allows
         * us to see how the server handles a fully valid request.
         */
        const res = await sendIt({
            params: { param: 'test' },
            query: { query: 'test' },
            payload: { payload: 'test' },
            cookie: { state: 'test' },
        });

        log.respond(res.result!);
    });

    it('fails on invalid payload', async () => {

        /**
         * We send a request to the server with a payload that
         * does not match the validation schema of the route. This
         * allows us to see how the server handles an invalid payload.
         */
        store._authenticatePayload = async (request, h) => {

            return new Error('authenticate payload');
        }

        /**
         * We send a request to the server with an invalid payload
         *
         * Note: In this case, we only pass the payload because
         * authentication and payload authentication are run before
         * validations happen, therefore we only need to pass the
         * payload to see the validation error.
         *
         * This also allows us to validate the order in which Hapi
         * handles the request lifecycle.
         */
        const res = await sendIt({ payload: { name: 'test' } });

        log.respond(res.result!);
    })

    it('validates params first', async () => {

        // We send a request to the server without the required param
        const res = await sendIt({});

        log.respond(res.result!);
    })

    it('validates query next', async () => {

        // We send a request to the server without the required query params
        const res = await sendIt({ params: { param: 'test' } });

        log.respond(res.result!);
    })

    it('validates payload next', async () => {

        // We send a request to the server without the required payload
        const res = await sendIt({
            params: { param: 'test' },
            query: { query: 'test' }
        });

        log.respond(res.result!);
    })

    it('validates cookie last', async () => {

        // We send a request to the server without the required cookie
        const res = await sendIt({
            params: { param: 'test' },
            query: { query: 'test' },
            payload: { payload: 'test' }
        });

        log.respond(res.result!);
    });

});
