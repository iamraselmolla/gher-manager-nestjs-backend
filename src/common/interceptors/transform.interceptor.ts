import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Wraps every successful controller return value in a consistent envelope:
 *   { success: true, data: ..., meta?: ... }
 * A controller may return `{ data, meta }` directly to attach pagination
 * metadata (total, page, pageSize); anything else is treated as the payload.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'meta' in result
        ) {
          return {
            success: true,
            data: (result as { data: T }).data,
            meta: (result as { meta: Record<string, unknown> }).meta,
          };
        }
        return { success: true, data: result };
      }),
    );
  }
}
