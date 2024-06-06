import Hapi from '@hapi/hapi'

type AnyLifecycleMethod = Hapi.Lifecycle.Method<any, any> | null
type AnyServerExtMethod = Hapi.ServerExtPointFunction<any> | null

export const store = {

    /**
     * Used to track the current step, given and test number
     */
    stepNo: 0,
    givenNo: 0,
    testNo: 0,

    /**
     * Config to modify output
     */
    dumpKeysLevels: 2,


    /**
     * Used as the auth argument passed to the validation
     * function in the server auth scheme. Useful for testing
     * how the server handles auth scenarios
     */
    authArgument: null as Hapi.AuthenticationData | null,

    /**
     * Server extension points
     *
     * Can be set to a function that will be called when
     * the server executes the corresponding hook
     */
    onPreStart: null as AnyServerExtMethod,
    onPostStart: null as AnyServerExtMethod,
    onPreStop: null as AnyServerExtMethod,
    onPostStop: null as AnyServerExtMethod,

    /**
     * Request extension points
     *
     * Can be set to a function that will be called when
     * the request executes the corresponding hook
     */
    onRequest: null as AnyLifecycleMethod,
    onPreAuth: null as AnyLifecycleMethod,
    onCredentials: null as AnyLifecycleMethod,
    onPostAuth: null as AnyLifecycleMethod,
    onPreHandler: null as AnyLifecycleMethod,
    onPostHandler: null as AnyLifecycleMethod,
    onPreResponse: null as AnyLifecycleMethod,
    onPostResponse: null as AnyLifecycleMethod,

    /**
     * Custom extension points
     *
     * Can be set to a function that will be called when
     * the server executes the corresponding function
     */
    _handler: null as AnyLifecycleMethod,
    _authenticate: null as AnyLifecycleMethod,
    _authenticatePayload: null as AnyLifecycleMethod,

    /**
     * Route extension points
     *
     * Can be set to a function that will be called when
     * the route executes the corresponding function
     */
    routeExt: {
        onPreAuth: null as AnyLifecycleMethod,
        onCredentials: null as AnyLifecycleMethod,
        onPostAuth: null as AnyLifecycleMethod,
        onPreHandler: null as AnyLifecycleMethod,
        onPostHandler: null as AnyLifecycleMethod,
        onPreResponse: null as AnyLifecycleMethod,
        onPostResponse: null as AnyLifecycleMethod,
    },


    /**
     * Restore all store values to their default values
     */
    restore() {

        this.onPreStart = null;
        this.onPostStart = null;
        this.onPreStop = null;
        this.onPostStop = null;

        this.onRequest = null;
        this.onPreAuth = null;
        this.onCredentials = null;
        this.onPostAuth = null;
        this.onPreHandler = null;
        this.onPostHandler = null;
        this.onPreResponse = null;
        this.onPostResponse = null;

        this._handler = null;
        this._authenticate = null;
        this._authenticatePayload = null;

        this.routeExt.onPreAuth = null;
        this.routeExt.onCredentials = null;
        this.routeExt.onPostAuth = null;
        this.routeExt.onPreHandler = null;
        this.routeExt.onPostHandler = null;
        this.routeExt.onPreResponse = null;
        this.routeExt.onPostResponse = null;
    },

}
