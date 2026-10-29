import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, take, filter } from 'rxjs/operators';
import { PlatformConstants, FilterOperator } from '@congarevenuecloud/core';
import { UserService, CollaborationRequestService, CollaborationRequest, CollaborationAuthenticationType } from '@congarevenuecloud/ecommerce';
import { DsrConstants } from '../services/dsr.service';

@Injectable({
  providedIn: 'root'
})
export class CollaborationAuthGuard implements CanActivate {

  constructor(
    private userService: UserService,
    private collaborationService: CollaborationRequestService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const quoteId = route.params['id'];

    if (!quoteId) {
      return this.router.createUrlTree(['/dsr-unauthorized']);
    }

    // Wait for the user session to be ready before evaluating the collaboration
    // request, so the guard never fires before the token is applied.
    return this.waitForSession().pipe(
      switchMap(() => this.validateByQuoteId(quoteId, state))
    );
  }

  /**
   * Gates guard evaluation until the user session is ready. When returning from a
   * login this guard initiated, waits for `isLoggedIn()`; otherwise waits for
   * `me()` to emit once. Prevents flashing the unauthorized page mid-login.
   */
  private waitForSession(): Observable<boolean> {
    const pendingRedirect = localStorage.getItem(PlatformConstants.REDIRECT_URL);
    if (pendingRedirect) {
      return this.userService.isLoggedIn().pipe(
        filter((isLoggedIn: boolean) => isLoggedIn === true),
        take(1)
      );
    }
    return this.userService.me().pipe(
      take(1),
      map(() => true)
    );
  }

  private validateByQuoteId(quoteId: string, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.collaborationService.getCollaborationRequest('Proposal', quoteId, [{ field: 'CollaborationType', value: 'Digital Commerce', filterOperator: FilterOperator.EQUAL }]).pipe(
      take(1),
      switchMap((collabRequest: CollaborationRequest) => {
        if (!collabRequest) {
          // No collaboration request found — deny access
          return of(this.router.createUrlTree(['/dsr-unauthorized']));
        }

        // Validate authentication. AccessType is persisted only when access is
        // granted, so a denied navigation never overwrites the previous value.
        return this.validateAuthentication(collabRequest, state);
      }),
      catchError(() => {
        // On any error, deny access. Never call login() here (would trigger an
        // OIDC redirect for anonymous collaboration users).
        return of(this.router.createUrlTree(['/dsr-unauthorized']));
      })
    );
  }

  private validateAuthentication(collabRequest: CollaborationRequest, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    if (collabRequest.AuthenticationType === CollaborationAuthenticationType.AuthenticatedWithLogin) {
      // Identity (RecordOwner) check is deferred to QuoteDetailsComponent.
      return this.userService.isLoggedIn().pipe(
        map((isLoggedIn: boolean) => {
          if (!isLoggedIn) {
            localStorage.setItem(PlatformConstants.REDIRECT_URL, state.url);
            this.userService.login(false);
            return false;
          }
          // Access granted — persist the AccessType (guard reruns after login).
          this.persistAccessType(collabRequest);
          return true;
        })
      );
    } else if (collabRequest.AuthenticationType === CollaborationAuthenticationType.Anonymous) {
      // Guest/anonymous users can proceed.
      this.persistAccessType(collabRequest);
      return of(true);
    } else {
      // Unknown authentication type — deny access.
      return of(this.router.createUrlTree(['/dsr-unauthorized']));
    }
  }

  /** Persists the granted AccessType so guards and the interceptor can enforce it from first load. */
  private persistAccessType(collabRequest: CollaborationRequest): void {
    localStorage.setItem(DsrConstants.ACCESS_TYPE_KEY, collabRequest.AccessType);
  }
}
