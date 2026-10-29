import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { get } from 'lodash';
import { PlatformConstants } from '@congarevenuecloud/core';
import { QuoteService, PriceListService, Quote, CartService } from '@congarevenuecloud/ecommerce';

// DSR storage keys
export enum DsrConstants {
  QUOTE_ID_KEY = 'dsrQuoteId',
  EDITED_LINE_ITEMS_KEY = 'dsrEditedLineItems',
  ACCESS_TYPE_KEY = 'dsrAccessType',
}

// DSR session state interface 
export interface DsrSessionState {
  quoteId: string | null;
  priceListId: string | null;
  quote: Quote | null;
  editedLineItems: boolean;
  accessType: string | null;
  /**
   * True once the collaboration AccessType has been resolved for the current quote.
   * Consumers that must not act on the transient initial `accessType: null` (e.g.
   * the header deciding whether to hydrate the cart) should wait for this flag.
   */
  accessTypeResolved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DsrService {

   // Storage keys
  private readonly DSR_QUOTE_ID_KEY = DsrConstants.QUOTE_ID_KEY;
  private readonly PRICELIST_ID_KEY = PlatformConstants.PRICELIST_ID;
  private readonly DSR_EDITED_LINE_ITEMS_KEY = DsrConstants.EDITED_LINE_ITEMS_KEY;
  private readonly DSR_ACCESS_TYPE_KEY = DsrConstants.ACCESS_TYPE_KEY;

   // BehaviorSubject for reactive DSR state management
  private dsrState$ = new BehaviorSubject<DsrSessionState>({
    quoteId: null,
    priceListId: null,
    quote: null,
    editedLineItems: false,
    accessType: null,
    accessTypeResolved: false
  });

  constructor(
    private quoteService: QuoteService,
    private priceListService: PriceListService,
    private cartService: CartService
  ) {
    // Initialize state from storage on service creation
    this.initializeStateFromStorage();
  }



   // Initialize DSR state from localStorage on service startup
   // Clear stale pricelist if not in DSR mode
  private initializeStateFromStorage(): void {
    const quoteId = localStorage.getItem(this.DSR_QUOTE_ID_KEY);
    const priceListId = localStorage.getItem(this.PRICELIST_ID_KEY);
    const editedLineItems = localStorage.getItem(this.DSR_EDITED_LINE_ITEMS_KEY) === 'true';
    const accessType = localStorage.getItem(this.DSR_ACCESS_TYPE_KEY);

    this.dsrState$.next({
      quoteId: quoteId,
      priceListId: priceListId,
      quote: null,
      editedLineItems: editedLineItems,
      accessType: accessType,
      accessTypeResolved: false
    });
  }

  // Get the observable DSR state
  getDsrState(): Observable<DsrSessionState> {
    return this.dsrState$.asObservable();
  }

   // Get the current DSR quote ID
  getDsrQuoteId(): string | null {
    return localStorage.getItem(this.DSR_QUOTE_ID_KEY);
  }

  /**
   * Store the quote ID (from the quote detail URL) to establish the DSR entry
   * point so catalog/cart pages can verify access.
   */
  setQuoteId(quoteId: string): void {
    localStorage.setItem(this.DSR_QUOTE_ID_KEY, quoteId);
    // Do NOT clear the AccessType here — the guard sets it before this runs and
    // the interceptor needs it immediately. Re-read it so reactive state rebinds
    // to the current quote; accessTypeResolved stays false until setAccessType().
    const currentState = this.dsrState$.value;
    const accessType = localStorage.getItem(this.DSR_ACCESS_TYPE_KEY);
    this.dsrState$.next({
      ...currentState,
      quoteId: quoteId,
      accessType: accessType,
      accessTypeResolved: false
    });
  }

  /**
   * Store the collaboration AccessType for the current DSR session.
   * Persisted in localStorage so it survives navigations between quote detail,
   * cart and (for FullEdit) catalog pages within the same session.
   * @param accessType The AccessType from the CollaborationRequest, or null if no request.
   */
  setAccessType(accessType: string | null): void {
    if (accessType) {
      localStorage.setItem(this.DSR_ACCESS_TYPE_KEY, accessType);
    } else {
      localStorage.removeItem(this.DSR_ACCESS_TYPE_KEY);
    }
    const currentState = this.dsrState$.value;
    this.dsrState$.next({
      ...currentState,
      accessType: accessType,
      // Lookup complete; the AccessType (including null) is final.
      accessTypeResolved: true
    });
  }

  /**
   * Returns the collaboration AccessType for the current DSR session.
   * Returns null if no collaboration request is associated with the current quote.
   */
  getAccessType(): string | null {
    return localStorage.getItem(this.DSR_ACCESS_TYPE_KEY);
  }

  /**
   * Check whether the user has entered DSR via the quote detail page.
   * Returns true if a quoteId is present in localStorage.
   */
  hasValidDsrEntry(): boolean {
    return !!localStorage.getItem(this.DSR_QUOTE_ID_KEY);
  }

   // Get the current DSR pricelist ID
  getDsrPriceListId(): string | null {
    return this.dsrState$.value.priceListId;
  }

  /**
   * Resolves the PriceListId for the given quote before its line items are loaded.
   * Reads it from the requested quote (fetched without line items) so the id always
   * belongs to that quote and no extra product lookup is triggered.
   */
  ensureDsrPriceList(quoteId: string): Observable<string | null> {
    return this.quoteService.getQuoteById(quoteId, false).pipe(
      take(1),
      map((quote: Quote) => {
        const priceListId = get(quote, 'PriceList.Id') || null;
        if (priceListId) {
          localStorage.setItem(this.PRICELIST_ID_KEY, priceListId);
        } else {
          // Drop any stale value from a previously opened quote.
          localStorage.removeItem(this.PRICELIST_ID_KEY);
        }
        // Sync the in-memory price list to this quote so quote-driven streams
        // (e.g. the catalog category sidebar) resolve against the quote's list.
        this.priceListService.refreshPriceList();
        this.dsrState$.next({ ...this.dsrState$.value, priceListId });
        return priceListId;
      }),
      catchError(() => of(null))
    );
  }

   // Activate DSR mode with a quote
  activateDsrMode(quoteId: string, setPriceList: boolean = true): Observable<DsrSessionState> {
    return this.quoteService.getQuote(quoteId).pipe(
      take(1),
      map((quote: Quote) => {
        const priceListId = get(quote, 'PriceList.Id');

        // Store in localStorage
        localStorage.setItem(this.DSR_QUOTE_ID_KEY, quoteId);

        if (priceListId && setPriceList) {
          localStorage.setItem(this.PRICELIST_ID_KEY, priceListId);
        }

        const state: DsrSessionState = {
          quoteId: quoteId,
          priceListId: priceListId,
          quote: quote,
          editedLineItems: false,
          accessType: localStorage.getItem(this.DSR_ACCESS_TYPE_KEY),
          accessTypeResolved: this.dsrState$.value.accessTypeResolved
        };

        this.dsrState$.next(state);

        return state;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

   // Deactivate DSR mode and clear storage state
  deactivateDsrMode(preservePriceList: boolean = false, cleanupCart: boolean = true): Observable<boolean> {
    const editedLineItems = localStorage.getItem(this.DSR_EDITED_LINE_ITEMS_KEY) === 'true';
    const shouldCleanupCart = cleanupCart && editedLineItems;

    // Clear DSR pricelist immediately to prevent it from persisting
    if (!preservePriceList) {
      localStorage.removeItem(this.PRICELIST_ID_KEY);
    }

    const restorePricelist$ = !preservePriceList 
      ? of(null).pipe(
          tap(() => this.priceListService.refreshPriceList()),
          switchMap(() => this.priceListService.getPriceList()),
          take(1),
          map(() => true)
        )
      : of(true);

    const deactivateState$ = shouldCleanupCart
      ? this.abandonCurrentCart().pipe(
          switchMap(() => restorePricelist$),
          switchMap(() => this.createAndActivateNewCart())
        )
      : restorePricelist$;
    
    return deactivateState$.pipe(
      tap(() => {
        // Clear DSR localStorage
        localStorage.removeItem(this.DSR_QUOTE_ID_KEY);
        localStorage.removeItem(this.DSR_EDITED_LINE_ITEMS_KEY);
        localStorage.removeItem(this.DSR_ACCESS_TYPE_KEY);

        this.dsrState$.next({
          quoteId: null,
          priceListId: preservePriceList ? localStorage.getItem(this.PRICELIST_ID_KEY) : null,
          quote: null,
          editedLineItems: false,
          accessType: null,
          accessTypeResolved: false
        });

      })
    );
  }

   // Abandon current active cart.

  private abandonCurrentCart(): Observable<boolean> {

    return this.cartService.getMyCart().pipe(
      take(1),
      switchMap(cart => {
        const cartId = get(cart, 'Id');
        
        if (!cartId) {
          return of(true);
        }
        
        return this.cartService.abandonCart(cartId).pipe(map(() => true));
      }),
      take(1),
      catchError(error => {
        this.cartService.deleteLocalCart();
        return of(true);
      })
    );
  }

   // Create and activate a new cart after pricelist restoration.

  private createAndActivateNewCart(): Observable<boolean> {

    return this.cartService.createNewCart().pipe(
      switchMap(newCart => {
        return this.cartService.setCartActive(newCart);
      }),
      map(() => {
        return true;
      }),
      catchError(error => {
        this.cartService.deleteLocalCart();
        return of(true);
      })
    );
  }

   // Mark that the user is editing line items
   // This is called when navigating to cart to edit line items from quote details
  setEditingLineItems(): void {
    localStorage.setItem(this.DSR_EDITED_LINE_ITEMS_KEY, 'true');
    const currentState = this.dsrState$.value;
    this.dsrState$.next({
      ...currentState,
      editedLineItems: true
    });
  }

   // Check if user has edited line items in current DSR session
  hasEditedLineItems(): boolean {
    return localStorage.getItem(this.DSR_EDITED_LINE_ITEMS_KEY) === 'true';
  }

  // Clear the editing line items flag
   // This should be called after user discards changes or finalizes the quote
  clearEditingLineItems(): void {
    localStorage.removeItem(this.DSR_EDITED_LINE_ITEMS_KEY);
    const currentState = this.dsrState$.value;
    this.dsrState$.next({
      ...currentState,
      editedLineItems: false
    });
  }
}
