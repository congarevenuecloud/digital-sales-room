import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { get, isNil, defaultTo } from 'lodash';
import { PlatformConstants } from '@congarevenuecloud/core';
import { PriceListService, PriceList } from '@congarevenuecloud/ecommerce';

/**
 * DSR-specific `PriceListService`.
 *
 * The base service resolves the active price list from the current account. In
 * DSR the price list must instead follow the *quote* being viewed, because a
 * collaborator's account can differ from the quote's account. This override
 * populates the in-memory price list from the quote's stored id and exposes it
 * through the same public streams, so consumers such as the category sidebar
 * (which waits on `getPriceListId()`) resolve against the quote's price list.
 * Registered in AppModule for the DSR app only.
 */
@Injectable()
export class DsrPriceListService extends PriceListService {

  /** Quote-driven price list state backing the public getters. */
  private readonly dsrPriceList$ = new BehaviorSubject<PriceList>(null);

  private readonly priceListKey: string = PlatformConstants.PRICELIST_ID;

  /**
   * Resolve the active price list from the quote's stored id (never the account)
   * and publish it. Falls back to the storefront default when no quote price list
   * is present. Never throws.
   * @override
   */
  override refreshPriceList(): void {
    const priceListId = localStorage.getItem(this.priceListKey);
    const source$ = priceListId
      ? this.getPriceListById(priceListId)
      : this.getDefaultPriceList();

    source$.pipe(take(1)).subscribe(priceList => {
      if (!isNil(priceList)) {
        localStorage.setItem(this.priceListKey, get(priceList, 'Id'));
        this.dsrPriceList$.next(priceList);
      }
    });
  }

  /** @override */
  override getPriceList(): Observable<PriceList> {
    return this.dsrPriceList$.pipe(filter(r => !isNil(r)));
  }

  /** @override */
  override getPriceListId(): Observable<string> {
    return this.dsrPriceList$.pipe(filter(r => !isNil(r)), map(r => r.Id));
  }

  /** @override */
  override getEffectivePriceListId(): Observable<string> {
    return this.dsrPriceList$.pipe(
      filter(r => !isNil(r)),
      map(r => defaultTo(get(r, 'BasedOnPriceList'), r)),
      map(r => r.Id)
    );
  }

  /** @override */
  override getEffectivePriceList(): Observable<PriceList> {
    return this.dsrPriceList$.pipe(
      filter(r => !isNil(r)),
      map(r => defaultTo(get(r, 'BasedOnPriceList'), r) as PriceList)
    );
  }
}
