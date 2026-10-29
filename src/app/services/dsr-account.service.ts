import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { switchMap, take, map, filter, tap, catchError } from 'rxjs/operators';
import { get, isNil } from 'lodash';
import { PlatformConstants } from '@congarevenuecloud/core';
import { AccountService, Account, UserService, PriceListService } from '@congarevenuecloud/ecommerce';

/**
 * DSR-specific `AccountService`.
 *
 * The base `AccountService.refreshAccount()` only publishes the active account
 * *after* `CartService.getMyCart()` emits (it hydrates the cart's Account in the
 * same chain). The DSR app deliberately replaces `CartService` with a variant
 * that performs no startup cart load (see dsr-cart-service.factory.ts), so that
 * cart stream never emits and the base account state stays `null` forever. Any
 * SDK code that waits on `getCurrentAccount()` — e.g.
 * `QuoteService.updateQuoteValue()` on the quote detail page — then hangs,
 * leaving the page stuck on its loader.
 *
 * This override resolves and publishes the active account independently of the
 * cart (no cart I/O), so account-dependent streams resolve without a live cart.
 * That keeps the read-only DSR entry point clean for AcceptReject reviewers.
 * Registered in AppModule for the DSR app only.
 */
@Injectable()
export class DsrAccountService extends AccountService {

    /** Resolved lazily; field initializers run after the AObjectService super ctor. */
    private readonly userSvc: UserService = this.injector.get(UserService);
    private readonly priceListSvc: PriceListService = this.injector.get(PriceListService);

    /** Cart-independent account state backing {@link getCurrentAccount}. */
    private readonly dsrAccount$ = new BehaviorSubject<Account>(null);

    private readonly accountStorageKey: string = PlatformConstants.ACCOUNT;

    /**
     * Resolve the active account (honouring external user-contact mapping) and
     * publish it without waiting on a cart. Never throws.
     * @override
     */
    override refreshAccount(): void {
        this.resolveExternalAccountId().pipe(
            switchMap(() => this.apiService.get(
                `${this.apiEndpointService.getRevenueAdminBaseUrl()}/accounts/active`, this.type
            )),
            take(1),
            tap((account: Account) => {
                if (!isNil(account)) {
                    localStorage.setItem(this.accountStorageKey, get(account, 'Id'));
                    // Publish the account and signal price-list resolution. In DSR the
                    // PriceListService is overridden to resolve the quote's price list
                    // (not the account's), so this no longer races the quote-specific
                    // PRICELIST_ID; it simply lets quote-driven streams (e.g. categories)
                    // populate.
                    this.priceListSvc.accountUpdated$.next(true);
                    this.dsrAccount$.next(account);
                }
            }),
            catchError(() => of(null))
        ).subscribe();
    }

    /**
     * Returns the active account resolved for the DSR session. Mirrors the base
     * contract (emits once a non-null account is available) but is backed by a
     * cart-independent subject.
     * @override
     */
    override getCurrentAccount(): Observable<Account> {
        return this.dsrAccount$.pipe(filter((account) => !isNil(account)));
    }

    /**
     * For external (Contact) users, stores the mapped account id in local storage
     * so the `/accounts/active` endpoint resolves to the external user's account.
     * No-op for internal users. Never throws.
     */
    private resolveExternalAccountId(): Observable<void> {
        return this.userSvc.isExternalUser().pipe(
            switchMap((isExternal) => isExternal ? this.userSvc.getUserContactMapping() : of(null)),
            map((mapping) => {
                const accountId = get(mapping, 'PrimaryObjectId');
                const primaryObjectName = get(mapping, 'PrimaryObjectName');
                if (accountId && primaryObjectName === this.metadataService.getObjectName(this.type)) {
                    localStorage.setItem(this.accountStorageKey, accountId);
                }
            }),
            take(1),
            catchError(() => of(null))
        );
    }
}
