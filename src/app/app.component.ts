import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { PlatformConstants } from '@congarevenuecloud/core';
import { StorefrontService, UserService } from '@congarevenuecloud/ecommerce';
import { BatchActionService, BatchSelectionService } from '@congarevenuecloud/elements';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();
  showDrawer$: Observable<boolean>;

  constructor(
    private batchSelectionService: BatchSelectionService,
    private batchActionService: BatchActionService,
    private titleService: Title,
    private translateService: TranslateService,
    private router: Router,
    private storefrontService: StorefrontService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.handlePostLoginRedirect();
    this.setTranslatedTitle();
    // DSR does not support saving products as favorites; hide the action from the product drawer.
    this.batchActionService.hideActions(['Save Favorite']);
    this.showDrawer$ = combineLatest([
      this.batchSelectionService.getSelectedProducts(),
      this.batchSelectionService.getSelectedLineItems()
    ]).pipe(
      map(([productList, lineItemList]) =>
        (productList?.length || 0) > 0 || (lineItemList?.length || 0) > 0
      )
    );
  }

  private handlePostLoginRedirect(): void {
    const returnUrl = localStorage.getItem(PlatformConstants.REDIRECT_URL);
    if (returnUrl) {
      this.userService.isLoggedIn().pipe(
        filter(isLoggedIn => isLoggedIn === true),
        take(1)
      ).subscribe(() => {
        localStorage.removeItem(PlatformConstants.REDIRECT_URL);
        this.router.navigateByUrl(returnUrl);
      });
    }
  }

  private setTranslatedTitle(): void {
    this.storefrontService.getStorefront().pipe(
      takeUntil(this._destroying$)
    ).subscribe(storefront => {
      const name = storefront?.Name;
      this.titleService.setTitle(name || 'Digital Sales Room');
    });
  }

  ngOnDestroy() {
    this._destroying$.next();
    this._destroying$.complete();
  }
}
