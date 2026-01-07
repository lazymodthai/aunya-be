/**
 * Interface for a standard message object.
 */
export interface IMessage {
    /** The machine-readable message code (e.g., 'CREATE_SUCCESS'). */
    msg: string;
    /** The business-specific error or success code. */
    code: number;
    /** The corresponding HTTP status code. */
    httpStatus: number;
    /** The human-readable description of the message. */
    description: string;
}

/**
 * A centralized repository of all business messages, codes, and descriptions
 * based on the provided standard. This structure allows for standardized
 * responses across the application.
 */
export const MSG_MASTER: { [key: string]: IMessage } = {
    // --- 1xxx: Success ---
    SUCCESS: {
        msg: 'SUCCESS',
        code: 1000,
        httpStatus: 200,
        description: 'Success',
    },
    UPDATE_SUCCESS: {
        msg: 'UPDATE_SUCCESS',
        code: 1000,
        httpStatus: 200,
        description: 'Data successfully updated',
    },
    CREATE_SUCCESS: {
        msg: 'CREATE_SUCCESS',
        code: 1000,
        httpStatus: 201,
        description: 'Creation successful',
    },
    REQUEST_ACCEPTED: {
        msg: 'REQUEST_ACCEPTED',
        code: 1000,
        httpStatus: 202,
        description: 'The request has been received and presumed to run in the background',
    },
    DELETE_SUCCESS: {
        msg: 'DELETE_SUCCESS',
        code: 1000,
        httpStatus: 204,
        description: 'Data successfully deleted',
    },

    // --- 11xx: Client Errors ---
    MISSING_PARAMETERS: {
        msg: 'MISSING_PARAMETERS',
        code: 1101,
        httpStatus: 400,
        description: 'Missing required parameters',
    },
    INVALID_PARAMETERS: {
        msg: 'INVALID_PARAMETERS',
        code: 1102,
        httpStatus: 400,
        description: 'Invalid parameters entered',
    },
    EMPTY_STRING_NOT_SUPPORTED: {
        msg: 'EMPTY_STRING_NOT_SUPPORTED',
        code: 1103,
        httpStatus: 400,
        description: 'Empty string input not supported',
    },
    NOT_FOUND: {
        msg: 'NOT_FOUND',
        code: 1104,
        httpStatus: 404,
        description: 'Requested entity record does not exist',
    },
    UNRECOGNIZED_FIELD: {
        msg: 'UNRECOGNIZED_FIELD',
        code: 1105,
        httpStatus: 400,
        description: 'Unrecognized field name was entered - Please check spelling and/or refer to the API docs for correct name',
    },
    DUPLICATE_ENTRY: {
        msg: 'DUPLICATE_ENTRY',
        code: 1111,
        httpStatus: 409, // Using 409 Conflict is more semantic for duplicate data than 400.
        description: 'Data entry duplicated with existing',
    },

    // --- 4xxx: Server Errors (Specific) ---
    CHANNEL_NOT_SUPPORTED: {
        msg: 'CHANNEL_NOT_SUPPORTED',
        code: 4101,
        httpStatus: 501,
        description: 'Current channel is not supported',
    },

    // --- 8xxx: Integration Errors ---
    DOWNSTREAM_INVALID_RESPONSE_400: {
        msg: 'DOWNSTREAM_INVALID_RESPONSE',
        code: 8101,
        httpStatus: 400,
        description: 'Invalid response from downstream service',
    },
    DOWNSTREAM_INVALID_RESPONSE_500: {
        msg: 'DOWNSTREAM_INVALID_RESPONSE',
        code: 8101,
        httpStatus: 500,
        description: 'Invalid response from downstream service',
    },
    PAYMENT_API_ERROR: {
        msg: 'PAYMENT_API_ERROR',
        code: 8102,
        httpStatus: 400,
        description: 'Payment API error code',
    },
    DATABASE_ERROR: {
        msg: 'DATABASE_ERROR',
        code: 8901,
        httpStatus: 500,
        description: 'Database error',
    },
    DB_CONNECTION_ERROR: {
        msg: 'DB_CONNECTION_ERROR',
        code: 8902,
        httpStatus: 500,
        description: 'Error getting mysql_pool connection',
    },

    // --- 9xxx: Security & Generic Errors ---
    MISSING_HEADER: {
        msg: 'MISSING_HEADER',
        code: 9100,
        httpStatus: 400,
        description: 'Required standard headers (FIELD_NAME) not found',
    },
    AUTH_CREDENTIALS_MISSING: {
        msg: 'AUTH_CREDENTIALS_MISSING',
        code: 9100,
        httpStatus: 401,
        description: 'Missing required authorization credentials',
    },
    AUTH_CREDENTIALS_REQUIRED: {
        msg: 'AUTH_CREDENTIALS_REQUIRED',
        code: 9100,
        httpStatus: 401,
        description: 'Authorization credentials required',
    },
    INVALID_EXPIRED_TOKEN: {
        msg: 'INVALID_EXPIRED_TOKEN',
        code: 9300,
        httpStatus: 401,
        description: 'Invalid/expired temporary token',
    },
    INVALID_API_KEY: {
        msg: 'INVALID_API_KEY',
        code: 9500,
        httpStatus: 401,
        description: 'Invalid api key provided',
    },
    INVALID_AUTH_CREDENTIALS: {
        msg: 'INVALID_AUTH_CREDENTIALS',
        code: 9500,
        httpStatus: 401,
        description: 'Invalid authorization credentials',
    },
    INVALID_ACCESS_RIGHTS: {
        msg: 'INVALID_ACCESS_RIGHTS',
        code: 9503,
        httpStatus: 403,
        description: 'Invalid access rights',
    },
    GENERIC_SERVER_ERROR: {
        msg: 'GENERIC_SERVER_ERROR',
        code: 9700,
        httpStatus: 500,
        description: 'Generic server side error',
    },
    METHOD_NOT_ALLOWED: {
        msg: 'METHOD_NOT_ALLOWED',
        code: 9900,
        httpStatus: 405,
        description: 'Wrong http method requested on endpoint',
    },
    UNSUPPORTED_MEDIA_TYPE: {
        msg: 'UNSUPPORTED_MEDIA_TYPE',
        code: 9900,
        httpStatus: 415,
        description: 'Unsupported content type defined',
    },
    THREAT_DETECTED: {
        msg: 'THREAT_DETECTED',
        code: 9900,
        httpStatus: 500,
        description: 'Threat has been detected',
    },
    UPSTREAM_INVALID_RESPONSE: {
        msg: 'UPSTREAM_INVALID_RESPONSE',
        code: 9900,
        httpStatus: 502,
        description: 'Invalid response from upstream server',
    },
    SERVICE_UNAVAILABLE: {
        msg: 'SERVICE_UNAVAILABLE',
        code: 9900,
        httpStatus: 503,
        description: 'Server is currently unavailable because traffic overload or it is down for maintenance',
    },
    MAINTENANCE_IN_PROGRESS: {
        msg: 'MAINTENANCE_IN_PROGRESS',
        code: 9900,
        httpStatus: 503,
        description: 'System maintenance in progress. We will be back shortly.',
    },
    GATEWAY_TIMEOUT: {
        msg: 'GATEWAY_TIMEOUT',
        code: 9900,
        httpStatus: 504,
        description: 'API Request Timeout',
    },
}
