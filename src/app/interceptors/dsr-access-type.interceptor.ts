import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CollaborationAccessType } from '@congarevenuecloud/ecommerce';
import { DsrConstants } from '../services/dsr.service';

/**
 * Suppresses background cart/catalog calls that an AcceptReject reviewer is not
 * permitted to make on the read-only quote detail page, returning a benign empty
 * response so no error toaster is shown. Scoped strictly to AcceptReject sessions
 * and the listed endpoints; all other traffic is untouched.
 */
@Injectable()
export class DsrAccessTypeInterceptor implements HttpInterceptor {

  /** URL fragments for the calls a reviewer may not make (matched case-insensitively). */
  private readonly blockedUrlFragments: string[] = [
    '/catalog/v1/products/details',
    '/cart/v1/carts/active'
  ];

  /** Matches `.../cart/v1/carts/{id}/activate`. */
  private readonly activateCartUrlPattern = /\/cart\/v1\/carts\/[^/]+\/activate/i;

  /** Matches `.../cart/v1/carts/{id}/status` (includes `carts/null/status`). */
  private readonly cartStatusUrlPattern = /\/cart\/v1\/carts\/[^/]+\/status/i;

  /** Matches a create-new-cart `POST .../cart/v1/carts` (no trailing sub-path). */
  private readonly createCartUrlPattern = /\/cart\/v1\/carts(?:\?.*)?$/i;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Fast path: only reviewers are affected, and only for the blocked endpoints.
    if (!this.isAcceptRejectReviewer() || !this.isBlockedEndpoint(req)) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError(() => {
        // Return a benign, correctly-shaped response so no error toaster is shown.
        return of(new HttpResponse({
          body: this.safeBodyFor(req.url),
          status: 200,
          statusText: 'OK',
          url: req.url
        }));
      })
    );
  }

  /** True when the active DSR collaboration session is an Accept/Reject review. */
  private isAcceptRejectReviewer(): boolean {
    // Read from storage directly to avoid a DI cycle.
    return localStorage.getItem(DsrConstants.ACCESS_TYPE_KEY) === CollaborationAccessType.AcceptReject;
  }

  private isBlockedEndpoint(req: HttpRequest<any>): boolean {
    const url = req.url || '';
    const lowerUrl = url.toLowerCase();
    if (this.blockedUrlFragments.some(fragment => lowerUrl.includes(fragment))) return true;
    if (this.activateCartUrlPattern.test(url)) return true;
    if (this.cartStatusUrlPattern.test(url)) return true;
    // Only a POST to the bare carts collection is a create-new-cart call.
    if (req.method === 'POST' && this.createCartUrlPattern.test(url)) return true;
    return false;
  }

  /** Returns an empty response body shaped for the given endpoint. */
  private safeBodyFor(url: string): unknown {
    const lowerUrl = (url || '').toLowerCase();
    if (lowerUrl.includes('/catalog/v1/products/details')) {
      return [];
    }
    if (this.cartStatusUrlPattern.test(url || '')) {
      return { CartResponse: { LineItems: [], NumberOfItems: 0 } };
    }
    if (this.createCartUrlPattern.test(url || '') && !this.cartStatusUrlPattern.test(url || '')) {
      return [{ Id: null }];
    }
    // carts/active and carts/{id}/activate.
    return {};
  }
}
