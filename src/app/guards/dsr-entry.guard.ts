import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserService, CollaborationAccessType } from '@congarevenuecloud/ecommerce';
import { DsrService } from '../services/dsr.service';

/**
 * Guards catalog/cart routes: requires DSR entry (quote visited first) and an
 * authenticated user, then applies AccessType route rules.
 *
 
 */
@Injectable({
  providedIn: 'root'
})
export class DsrEntryGuard implements CanActivate {

  constructor(
    private dsrService: DsrService,
    private router: Router,
    private userService: UserService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    if (!this.dsrService.hasValidDsrEntry()) {
      return of(this.router.createUrlTree(['/dsr-unauthorized'], {
        queryParams: { returnUrl: state.url }
      }));
    }

    // Guest users (anonymous collaboration) are restricted to the quote detail page only.
    return this.userService.isLoggedIn().pipe(
      take(1),
      map(isLoggedIn => {
        if (!isLoggedIn) {
          return this.router.createUrlTree(['/dsr-unauthorized'], {
            queryParams: { returnUrl: state.url }
          });
        }

        // AccessType route restrictions:
        // - AcceptReject: quote detail page only → block all catalog and cart routes.
        // - RestrictedEdit: cart allowed, catalog blocked.
        // - FullEdit / null: no restriction.
        const isCatalogRoute = state.url.startsWith('/products') || state.url.startsWith('/search');
        const isCartRoute = state.url.startsWith('/carts');
        const accessType = this.dsrService.getAccessType();

        if (accessType === CollaborationAccessType.AcceptReject && (isCatalogRoute || isCartRoute)) {
          return this.router.createUrlTree(['/dsr-unauthorized'], {
            queryParams: { returnUrl: state.url }
          });
        }

        if (isCatalogRoute && accessType === CollaborationAccessType.RestrictedEdit) {
          return this.router.createUrlTree(['/dsr-unauthorized'], {
            queryParams: { returnUrl: state.url }
          });
        }

        return true;
      })
    );
  }
}
