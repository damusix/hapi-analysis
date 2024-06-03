import Hapi from '@hapi/hapi';

import Joi from 'joi';

import {
    handler,
    _progress,
    makeExtForRoute
} from '..';


export const inspectRoutes = (server: Hapi.Server) => {

    /**
     * Generic, no auth route
     */
    server.route({
        method: 'GET',
        path: '/',
        handler,
    });

    /**
     * Auth route
     */
    server.route({
        method: ['GET', 'POST'],
        path: '/auth',
        handler,
        options: {
            auth: {
                strategy: 'test',
            }
        }
    });

    /**
     * Auth route
     */
    server.route({
        method: 'POST',
        path: '/full-request/{param?}',
        handler,
        options: {
            auth: {
                strategy: 'test',
                payload: 'required'
            },
            validate: {
                payload: Joi.object({
                    lastName: Joi.string().required(),
                }),
                query: Joi.object({
                    firstName: Joi.string().required(),
                }),
                params: Joi.object({
                    param: Joi.string().required(),
                }),
                state: Joi.object({
                    sid: Joi.string().required(),
                }),
                headers: Joi.object({
                    cookie: Joi.string().required(),
                }).unknown(true),
            },
            pre: [
                {
                    method: () => 'something',
                    assign: 'pre1'
                },
                {
                    method: () => 'anotherthing',
                    assign: 'pre2'
                },
            ],
            response: {
                schema: Joi.object({
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required(),
                })
            }
        }
    });

    /**
     * Route with validation
     */
    server.route({
        method: 'POST',
        path: '/validation/{param?}',
        handler,
        options: {
            auth: {
                strategy: 'test',
                payload: 'required'
            },
            validate: {
                payload: Joi.object({
                    payload: Joi.string().required(),
                }),
                query: Joi.object({
                    query: Joi.string().required(),
                }),
                params: Joi.object({
                    param: Joi.string().required(),
                }),
                state: Joi.object({
                    state: Joi.string().required(),
                }),
            }
        }
    });

    /**
     * Route with authentication and extension points
     */
    server.route({
        method: 'GET',
        path: '/auth/ext',
        handler,
        options: {
            auth: {
                strategy: 'test',
            },
            ext: {
                onPreAuth: makeExtForRoute('onPreAuth'),
                onCredentials: makeExtForRoute('onPreAuth'),
                onPostAuth: makeExtForRoute('onPreAuth'),
                onPreHandler: makeExtForRoute('onPreAuth'),
                onPostHandler: makeExtForRoute('onPreAuth'),
                onPreResponse: makeExtForRoute('onPreAuth'),
                onPostResponse: makeExtForRoute('onPreAuth'),
            }
        }
    });
}