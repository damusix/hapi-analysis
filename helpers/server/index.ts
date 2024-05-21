import Hapi from '@hapi/hapi';

export * from './authentication';
export * from './events';
export * from './routes';
export * from './extensions';

import {
    failAction,
} from '..';

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
