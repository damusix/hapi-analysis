import Hapi from '@hapi/hapi';

export * from './authentication';
export * from './events';
export * from './routes';
export * from './extensions';
export * from './scenarios';

import {
    mkFailAction,
    stepper,
} from '..';

export const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
        validate: { failAction: mkFailAction('Validate failAction is next') },
        payload: { failAction: mkFailAction('Payload failAction is next') },
        response: { failAction: mkFailAction('Response failAction is next') },
        state: { failAction: mkFailAction('State failAction is next') },
    }
});

server.ext('onRequest', (req, h) => {

    stepper.requesting(req);

    return h.continue;
});

// Make sure it's the last extension
server.ext('onPreStart', (srv) => {

    server.ext('onPostResponse', (req, h) => {

        stepper.emit('responded', req);

        return h.continue;
    })
});