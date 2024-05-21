import Hapi from '@hapi/hapi';

import {
    log,
    _progress,
    ignoreExt,
    store
} from '..';

export const inspectAuthScheme = (server: Hapi.Server) => {

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
}