import { Component, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, tap, filter, startWith, distinctUntilChanged } from 'rxjs/operators';
import { first, defaultTo, get } from 'lodash';
import {
  Storefront,
  StorefrontService,
  UserService,
  User,
  CollaborationAccessType
} from '@congarevenuecloud/ecommerce';
import { DsrService } from '../../services/dsr.service';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  pageTop: boolean = true;
  userInitials: string = null;
  storefront$: Observable<Storefront>;
  storeLogo$: Observable<string>;
  user$: Observable<User>;
  showAccountHome: boolean = false;
  /** Show the mini cart only for FullEdit users (hidden for AcceptReject and RestrictedEdit). */
  showMiniCart$: Observable<boolean>;
  /** Show the product search only for FullEdit users. */
  showSearch$: Observable<boolean>;

  constructor(
    private userService: UserService,
    private storefrontService: StorefrontService,
    private dsrService: DsrService,
    private router: Router
  ) { }

  ngOnInit() {
    this.storefront$ = this.storefrontService.getStorefront();
    this.storeLogo$ = this.storefront$.pipe(
      map((storefront) => get(storefront, 'Logo', null))
    );
    this.user$ = this.userService.me().pipe(
      tap((user: User) => {
        this.userInitials = ((defaultTo(first(user.FirstName), '') as string) +
          defaultTo(first(user.LastName), '')) as string;
      })
    );
    this.showMiniCart$ = combineLatest([
      this.dsrService.getDsrState(),
      this.userService.isLoggedIn(),
      this.isQuoteDetailPage$()
    ]).pipe(
      map(([state, isLoggedIn, isQuoteDetailPage]) => isLoggedIn && !isQuoteDetailPage && state.accessType === CollaborationAccessType.FullEdit),
      distinctUntilChanged()
    );
    this.showSearch$ = combineLatest([
      this.dsrService.getDsrState(),
      this.userService.isLoggedIn(),
      this.isQuoteDetailPage$()
    ]).pipe(
      map(([state, isLoggedIn, isQuoteDetailPage]) => isLoggedIn && !isQuoteDetailPage && state.accessType === CollaborationAccessType.FullEdit),
      distinctUntilChanged()
    );
  }

  /** True on the quote detail page (`/proposals/:id`), where search and mini cart are hidden. */
  private isQuoteDetailPage$(): Observable<boolean> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => this.isProposalsUrl(get(event, 'urlAfterRedirects') || get(event, 'url'))),
      startWith(this.isProposalsUrl(this.router.url)),
      distinctUntilChanged()
    );
  }

  /** True when the given URL points at the quote detail (proposals) route. */
  private isProposalsUrl(url: string): boolean {
    return /(^|\/)proposals(\/|$|\?)/.test(defaultTo(url, ''));
  }

  /**
   * Logo navigates to the current quote detail page for all access types.
   * Falls back to the app root when no DSR quote is established.
   */
  getLogoLink(): Array<string> {
    const quoteId = this.dsrService.getDsrQuoteId();
    return quoteId ? ['/proposals', quoteId] : ['/'];
  }

  login() {
    this.userService.login(false);
  }

  doLogout() {
    this.userService.logout();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event) {
    this.pageTop = window.pageYOffset <= 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event?.target as HTMLElement;
    if (!clickedElement.closest('#accountMenu') && !clickedElement.closest('.dropdown-toggle')) {
      this.showAccountHome = false;
    }
  }

  toggleMyAccountDropdown(event?: Event): void {
    event.stopImmediatePropagation();
    this.showAccountHome = !this.showAccountHome;
  }
}
