import Boom from '@hapi/boom';
import Hapi from '@hapi/hapi';

import {
    log,
    _progress,
    ignoreExt,
    throwErrorOn,
    store,
    stepper,
    returnErrorOn
} from '..';

export const inspectAuthScheme = (server: Hapi.Server) => {

    /**
     * We add a custom auth scheme to the server. This will allow us
     * to test how the server handles authentication scenarios.
     */
    server.auth.scheme('custom', (server, options) => ({

        authenticate: async (request, h) => {

            if (ignoreExt.has('_authenticate')) {

                log.ignore('authenticate');
                return h.continue;
            }

            await stepper.next('Auth scheme authenticate is next');

            if (throwErrorOn.has('_authenticate')) {

                log.err('authenticate');
                return new Error('authenticate');
            }

            if(returnErrorOn.has('_authenticate')) {

                log.err('authenticate');
                return h.unauthenticated(
                    Boom.unauthorized('authenticate')
                );
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

                log.ignore('authenticate payload');
                return h.continue;
            }

            await stepper.next('Auth scheme authenticate payload is next');

            if (throwErrorOn.has('_authenticatePayload')) {

                log.err('authenticate payload');
                return new Error('authenticate payload');
            }

            if(returnErrorOn.has('_authenticatePayload')) {

                log.err('authenticate payload');
                return Boom.unauthorized('authenticate payload');
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
}