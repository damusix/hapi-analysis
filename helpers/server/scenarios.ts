import Hapi from '@hapi/hapi';
import { F } from 'ts-toolbelt';

import {
    inspectAuthScheme,
    inspectReqHooks,
    inspectResponses,
    inspectRoutes,
    inspectSrvHooks,
    log,
    server
} from '..';

export const preScenarios = (otherScenarios?: F.Function) => {

    given.always('Pre hooks', async () => {

        before(() => {

            inspectAuthScheme(server);
            inspectSrvHooks(server);
            inspectReqHooks(server);
            inspectResponses(server);
            inspectRoutes(server);
        })

        it('starts the server', async () => {

            await server.start();

            log.step('server started at', server.info.uri);
        });

        otherScenarios && otherScenarios();
    });
}

export const postScenarios = (otherScenarios?: F.Function) => {


    given.always('Post hooks', () => {

        it('stops the server', async () => {

            await server.stop();

            log.step('server stopped');
        });

        otherScenarios && otherScenarios();
    });

}