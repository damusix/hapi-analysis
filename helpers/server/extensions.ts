import Hapi from '@hapi/hapi';
import { failAction, mkReqExt, mkSrvExt } from '../hapi';

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
     *
     * If the test suite is set to throw an error on onPreResponse hook,
     * then this failAction will be ignored because the previous hook
     * above would have thrown an error.
     */
    server.ext('onPreResponse', failAction as Hapi.Lifecycle.Method);
}