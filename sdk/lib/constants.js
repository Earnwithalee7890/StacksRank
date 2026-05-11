/**
 * Clarity Type Tags and Constants
 * 
 * Based on the Stacks blockchain specification for Clarity value encoding.
 */

const CLARITY_TYPE_TAGS = {
    INT: 0x00,
    UINT: 0x01,
    BUFFER: 0x02,
    BOOL_TRUE: 0x03,
    BOOL_FALSE: 0x04,
    PRINCIPAL_STANDARD: 0x05,
    PRINCIPAL_CONTRACT: 0x06,
    RESPONSE_OK: 0x07,
    RESPONSE_ERR: 0x08,
    OPTIONAL_NONE: 0x09,
    OPTIONAL_SOME: 0x0a,
    LIST: 0x0b,
    TUPLE: 0x0c,
    STRING_ASCII: 0x0d,
    STRING_UTF8: 0x0e
};

module.exports = {
    CLARITY_TYPE_TAGS
};
