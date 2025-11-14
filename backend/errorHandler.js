export const stringCodes = {
  ENOTFOUND: 500,
  CONNREFUSED: 500,
  ETIMEDOUT: 504,
  ECONNRESET: 502,
  EAI_AGAIN: 502,
  ERR_BAD_REQUEST: 400,
  invalid_token: 422,
  invalid_scope: 422,
  bad_credentials: 401,
  max_retries_exceeded: 429,

  // pollination AI
  safe_content_violation: 403,
  model_not_supported: 404,
  response_format_error: 400,
  empty_output: 504,
};

export const apiErrors = (code, source, area) => {
  const errorMessage = {
    400: "Bad Request",
    401: "Unauthorized - authentication credentials missing or invalid",
    403: "Forbidden - rate limit exceeded or insufficent permissions",
    404:
      source === "pollinationAPI"
        ? "Model not found or invalid endpoint"
        : area === "repo"
        ? "Github repo not found"
        : "Github user not found",
    422: "Invalid parameter",
    410: "Gone - resource no longer available",
    429: "Too Many Requests - rate limit exceeded",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    529: "Overloaded API - Delay and Retry",
    598: "Network Read Timeout",
    599: "Network Connect Timeout",
  };

  return errorMessage[code] || "An unknown error occurred";
};
