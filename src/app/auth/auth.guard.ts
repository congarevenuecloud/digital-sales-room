import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { includes } from 'lodash';
import { ApiService, PlatformConstants } from '@congarevenuecloud/core';
import { UserService } from '@congarevenuecloud/ecommerce';

/**
 * Root route guard — ensures a valid guest token exists before any child route
 * (and its guards) are activated.
 *
 * Previously this guard fired `guestUserService.login()` as a fire-and-forget
 * call and immediately returned `true`. That created a race: the child
 * `CollaborationAuthGuard` would call `getCollaborationRequest()` before the
 * guest token was ready, receive a 401, and its `catchError` would redirect to
 * `/dsr-unauthorized`. Once authentication settled the app re-navigated to the
 * quote detail page — producing a visible "unauthorized then quote" flash even
 * for users who are fully authorised.
 *
 * The guard now waits for the guest token to be provisioned (via
 * `apiService.refreshToken()`) before resolving, so downstream guards always run
 * with a valid token. It still never blocks navigation — access control for DSR
 * routes is handled by CollaborationAuthGuard / DsrEntryGuard.
 *
 * REQUIREMENT: env.json (served at the app origin root) must include a `guestUserId`
 * field so that refreshToken() can obtain a valid guest token. Without this, the
 * anonymous collaboration guest user flow will not work.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorizationGuard {

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    // Post-login deep-link recovery.
    //
    // After OIDC login the IdP redirects to the app's configured redirectUrl,
    // which is the app ROOT (origin + pathname) — not the deep /proposals/:id
    // link the user originally requested. The default routing then cascades
    // '' → proposals → /products, and /products is protected by DsrEntryGuard,
    // which bounces AcceptReject/RestrictedEdit users to /dsr-unauthorized — a
    // visible ~1s flash before app.component re-navigates to the saved URL.
    //
    // To avoid that, if a REDIRECT_URL is pending (set by CollaborationAuthGuard
    // before it triggered login) and the current navigation isn't already headed
    // there, redirect STRAIGHT to the saved URL. The intermediate /products route
    // is never activated, so DsrEntryGuard never runs and no unauthorized page
    // flashes. We do NOT wait for login here (that would block the app shell from
    // rendering and can deadlock); CollaborationAuthGuard on the target route
    // already waits for the session before validating.
    const pendingRedirect = localStorage.getItem(PlatformConstants.REDIRECT_URL);
    if (pendingRedirect && state.url !== pendingRedirect) {
      return this.router.parseUrl(pendingRedirect);
    }

    return this.apiService.isGuestAuthenticated().pipe(
      switchMap(guestAuthenticated => {
        if (guestAuthenticated) {
          return of(true);
        }
        // No valid token yet. Wait for the guest token to be provisioned before
        // letting child guards run, so they don't 401 and bounce to the
        // unauthorized page. This mirrors GuestUserService.login() but returns
        // the observable so navigation can await it. When the guest-user feature
        // is disabled in the org, fall back to the interactive platform login.
        return this.apiService.refreshToken().pipe(
          map(res => {
            if (includes(res, 'Guest user feature is disabled')) {
              this.userService.login();
            }
            return true;
          }),
          catchError(() => of(true))
        );
      })
    );
  }
}


