import Hapi, { Lifecycle } from '@hapi/hapi';

import {
    server,
    reqExts,
    store,
    returnErrorOn,
    diffJson,
    log,
    ignoreExt,
    inspectAuthScheme,
    inspectSrvHooks,
    inspectReqHooks,
    inspectResponses,
    inspectRoutes
} from './helpers';

given.always('A server is prepared', () => {

    it('adds a custom auth scheme', () => {

        inspectAuthScheme(server);
    });

    it('adds hooks', () => {

        inspectSrvHooks(server);
        inspectReqHooks(server);
        inspectResponses(server);
    });

    it('adds routes', () => {

        inspectRoutes(server);
    });
});


given('Pre hooks', async () => {

    it('starts the server', async () => {

        await server.start();

        log.step('server started at', server.info.uri);
    });
});

given('Route with auth', async () => {

    before(() => {

        ignoreExt.clear();

        store.authArgument = {
            credentials: {
                name: 'john',
                scope: ['admin']
            }
        };

        // let info: any = {};

        const extractResponse = (req: Hapi.Request) => {

            const res = req.response as Hapi.ResponseObject;

            if (!res) {
                return {};
            }

            return {
                headers: res.headers,
                payload: res.source,
                settings: res.settings,
                statusCode: res.statusCode,
            };
        }

        const logStateOfRequest: (step: keyof typeof store, txt: string | string[]) => Lifecycle.Method = (step, msg) => (req, h) => {

            msg = Array.isArray(msg) ? msg : [msg];

            log.comments(msg);

            const thisInfo = {
                'req.route.method': req.route.method,
                'req.route.path': req.route.path,
                'req.url.pathname': req.url.pathname,
                'req.params': req.params,
                'req.query': req.query,
                'req.payload': req.payload,
                'req.headers': req.headers,
                'req.state': req.state,
                'req.auth': req.auth,
                'req.pre': req.pre,
                'req.response': extractResponse(req as any),
            };

            log.bulletInfo(thisInfo);

            if (step === '_authenticate') {

                return h.authenticated(store.authArgument!);
            }

            if (step === '_handler') {

                return {
                    firstName: req.query.firstName,
                    lastName: (req.payload as any).lastName
                }
            }

            return h.continue;
        }

        store.onRequest = logStateOfRequest(
            'onRequest',
            [
                'Route is not yet found',
                'Cookies, Params, Payload, and Auth are not yet parsed',
            ]
        );

        store.onPreAuth = logStateOfRequest(
            'onPreAuth',
            [
                'Route is found',
                'Params, Cookies (state) are parsed',
                'Payload and Auth are not yet parsed'
            ]
        );

        store._authenticate = logStateOfRequest(
            '_authenticate',
            [
                'Authentication is now being performed',
                'Payload is not yet parsed'
            ]
        );

        store._authenticatePayload = logStateOfRequest(
            '_authenticatePayload',
            [
                'Auth is now parsed',
                'Payload is now being parsed and authenticated'
            ]
        );

        store.onCredentials = logStateOfRequest(
            'onCredentials',
            [
                'Credentials are now available on the Auth object'
            ]
        );

        store.onPostAuth = logStateOfRequest(
            'onPostAuth',
            [
                'Authentication is completed',
                'Nothing has been validated yet'
            ]
        );

        store.onPreHandler = logStateOfRequest(
            'onPreHandler',
            [
                'Headers, Params, Query, Payload, and Cookies have now been validated',
                'Prerequisites have not been run yet',
            ]
        );

        store._handler = logStateOfRequest(
            '_handler',
            [
                'Prerequisites are now available',
                'Handler is now being executed',
            ]
        );

        store.onPostHandler = logStateOfRequest(
            'onPostHandler',
            [
                'Response is now available',
                'Response has not been validated yet',
            ]
        );

        store.onPreResponse = logStateOfRequest(
            'onPreResponse',
            [
                'Response was validated',
                'This is always called despite errors in the lifecycle',
                'Not events have been triggered yet',
                'The response is not yet transmitted'
            ]
        );

        store.onPostResponse = logStateOfRequest(
            'onPostResponse',
            [
                'Response was transmitted',
                'All response events have been triggered',
                'Request error events have not been triggered yet',
            ]
        );

    });

    it('doesnt throw errors on route with auth', async () => {

        const res = await server.inject({
            method: 'POST',
            url: '/full-request/lifecycle?firstName=john',
            headers: {
                cookie: 'sid=123456'
            },
            payload: {
                lastName: 'doe'
            }
        });

        log.respond(res.result!);
    });

})


// given('R')

given('Post hooks', () => {

    it('stops the server', async () => {

        await server.stop();

        log.step('server stopped');
    });
});
