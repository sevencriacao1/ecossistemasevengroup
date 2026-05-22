import certificateHandler from '../../api/render-certificate.js';

export async function handler(event) {
  const headers = {};
  let statusCode = 200;
  let responseBody = '';
  let isBase64Encoded = false;

  const response = {
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      statusCode = code;
      return {
        send(value) {
          if (Buffer.isBuffer(value)) {
            responseBody = value.toString('base64');
            isBase64Encoded = true;
          } else {
            responseBody = String(value);
          }
        },
        json(value) {
          headers['Content-Type'] = 'application/json';
          responseBody = JSON.stringify(value);
        },
      };
    },
  };

  await certificateHandler(
    {
      method: event.httpMethod,
      body: event.body ? JSON.parse(event.body) : {},
      headers: event.headers ?? {},
    },
    response
  );

  return {
    statusCode,
    headers,
    body: responseBody,
    isBase64Encoded,
  };
}
