import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message: string = error.error?.message ?? 'Ocurrió un error inesperado';
        return throwError(() => new Error(message));
      }
      return throwError(() => error);
    }),
  );
};
