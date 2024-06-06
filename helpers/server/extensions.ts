import Hapi, { Lifecycle } from '@hapi/hapi';
import { mkFailAction, mkReqExt, mkSrvExt } from '../hapi';
import { stepper } from '..';

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


export const inspectSrvHooks = (server: Hapi.Server) => {


    for (const ext of srvExts) {

        server.ext(...mkSrvExt(ext));
    }
};

export const inspectReqHooks = (server: Hapi.Server) => {

    for (const ext of reqExts) {

        server.ext(...mkReqExt(ext));
    }
}

export const inspectResponses = (server: Hapi.Server) => {


    /**
     * We add a global fail action to the server. This will be used
     * to test how the server handles validation errors.
     */
    server.events.on(
        'response',
        (req) => (

            mkFailAction(false)(req, null as any)
        )
    );

}