import Hapi from '@hapi/hapi';
import HapiRequest from '@hapi/hapi/lib/request';

import { O } from 'ts-toolbelt';

import {
    log,
} from '..';

/**
 * Events exactly as defined in https://github.com/hapijs/hapi/tree/master/lib/core.js#L37
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

export const attachToEvents = (server: Hapi.Server) => {

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

}