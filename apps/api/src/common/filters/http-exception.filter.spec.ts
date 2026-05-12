import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function makeHost(url = '/api/test'): {
  host: ArgumentsHost;
  json: jest.Mock;
  status: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('uses HttpException status for known exceptions', () => {
    const { host, status } = makeHost();
    filter.catch(new NotFoundException('missing'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('falls back to 500 for unknown exceptions', () => {
    const { host, status, json } = makeHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });

  it('returns statusCode + path + timestamp envelope', () => {
    const { host, json } = makeHost('/api/foo');
    filter.catch(new NotFoundException('missing'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/api/foo',
        timestamp: expect.any(String),
      }),
    );
    const arg = json.mock.calls[0][0];
    expect(Number.isNaN(Date.parse(arg.timestamp))).toBe(false);
  });

  it('extracts string message from string exception response', () => {
    const { host, json } = makeHost();
    filter.catch(new BadRequestException('bad input'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'bad input' }),
    );
  });

  it('extracts message field from object exception response', () => {
    const { host, json } = makeHost();
    filter.catch(
      new BadRequestException({
        message: ['field required'],
        error: 'Bad Request',
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['field required'] }),
    );
  });

  it('returns full raw object when message field absent', () => {
    const { host, json } = makeHost();
    filter.catch(new BadRequestException({ custom: 'shape' }), host);
    const arg = json.mock.calls[0][0];
    expect(arg.message).toEqual({ custom: 'shape' });
  });
});
