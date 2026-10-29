import { Component, OnInit, TemplateRef, ViewChild, NgZone, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { plainToClass } from 'class-transformer';
import { Observable, combineLatest, of, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, take, catchError } from 'rxjs/operators';
import { get, filter, isNil, isEqual, set, isNull, forEach, lowerCase, pick } from 'lodash';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Cart, CartItem, CartService, ConstraintRuleService, ItemGroup, LineItemService, QuoteService, Quote, Order, OrderService, ItemRequest, CollaborationAccessType, StorefrontService, UserService, DetailActionArea, DetailActionSection, DetailActionSet, DetailAction, DisplayColumn, DisplayColumnSection } from '@congarevenuecloud/ecommerce';
import { BatchActionService, RevalidateCartService, ExceptionService, ButtonAction, BatchSelectionService, UserViewMappingService, DisplayColumnService } from '@congarevenuecloud/elements';
import { DsrService } from '../../../services/dsr.service';
import { DEFAULT_DETAIL_ACTIONS } from '../../../services/detail-actions.config';

@Component({
  standalone: false,
  selector: 'app-manage-cart',
  templateUrl: './manage-cart.component.html',
  styleUrls: ['./manage-cart.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ManageCartComponent implements OnInit {

  @ViewChild('discardChangesTemplate') discardChangesTemplate: TemplateRef<any>;
  @ViewChild('cloneCartTemplate') cloneCartTemplate: TemplateRef<any>;
  /**
   * Observable of the information for rendering this view.
   */
  modalRef: BsModalRef;
  view$: BehaviorSubject<ManageCartState> = new BehaviorSubject<ManageCartState>(null);
  businessObject$: Observable<Order | Quote> = of(null);
  quoteConfirmation: Quote;
  confirmationModal: BsModalRef;
  loading: boolean = false;
  primaryLI: Array<CartItem> = [];
  readOnly: boolean = false;
  cart: Cart;
  disabled: boolean;
  isCartFinalized: boolean = false;
  subscriptions: Array<Subscription> = new Array();

  // Cart summary fields from the displayColumns API; empty keeps the built-in summary layout.
  cartColumns: Array<DisplayColumn> = [];

  // Configured price columns. Null or empty keeps the built-in price fields.
  priceColumns: Array<DisplayColumn> = null;

  searchText: string;
  cartName: string;
  selectedCount: number = 0;
  /** True when the collaboration AccessType is RestrictedEdit — hides Add Products buttons. */
  isRestrictedEdit: boolean = false;
  customButtonActions: Array<ButtonAction> = [
    {
      label: 'MY_ACCOUNT.CART_LIST.CLONE_CART',
      enabled: true,
      onClick: () => this.openCloneCartModal(),
    },
  ]
  showSideNav: boolean = false;

  // Whether the current visitor is authenticated; drives the action UserType constraints.
  isLoggedIn: boolean = false;

  // Action configuration from the displayActions API, falling back to the built-in defaults.
  actions: DetailActionSet = new DetailActionSet(DetailActionSection.Cart, DEFAULT_DETAIL_ACTIONS, () => ({
    stage: get(this.cart, 'Status'),
    isLoggedIn: this.isLoggedIn
  }));

  // Placement buckets exposed to the template.
  readonly actionArea = DetailActionArea;

  // Stable header cart actions; a fixed array reference avoids a price-summary change-detection loop.
  cartMainActions: Array<DetailAction> = [];

  constructor(private cartService: CartService,
    private orderService: OrderService,
    private crService: ConstraintRuleService,
    private quoteService: QuoteService,
    private activatedRoute: ActivatedRoute,
    public batchActionService: BatchActionService,
    private revalidateCartService: RevalidateCartService,
    private router: Router,
    private ngZone: NgZone,
    private modalService: BsModalService,
    private exceptionService: ExceptionService,
    public batchSelectionService: BatchSelectionService,
    private storefrontService: StorefrontService,
    private userService: UserService,
    private userViewMappingService: UserViewMappingService,
    private cdr: ChangeDetectorRef,
    private dsrService: DsrService,
    private displayColumnService: DisplayColumnService) {
    this.isRestrictedEdit = this.dsrService.getAccessType() === CollaborationAccessType.RestrictedEdit;
  }

  // Loads the storefront column and action overrides for this page in a single pass.
  private loadDisplayActions(): void {
    this.subscriptions.push(
      this.storefrontService.getStorefront().pipe(
        take(1),
        switchMap((storefront) => {
          const flow = get(storefront, 'DefaultFlow') || 'system';
          return combineLatest([
            this.storefrontService.getStorefrontDisplayColumns(flow, get(storefront, 'Id')).pipe(catchError(() => of([]))),
            this.storefrontService.getStorefrontDisplayActions(flow, get(storefront, 'Id')).pipe(catchError(() => of([]))),
            this.userService.isGuest().pipe(take(1), catchError(() => of(false)))
          ]);
        }),
        catchError(() => of<[Array<DisplayColumn>, Array<DetailAction>, boolean]>([[], [], false]))
      ).subscribe(([columnsResponse, actionsResponse, isGuest]) => {
        // Guests only lose the columns explicitly marked ShowForGuest false; a column that says
        // nothing about guests stays visible, so an unconfigured storefront is unaffected.
        const forSection = (section: string): Array<DisplayColumn> => this.displayColumnService.columnsForSection(columnsResponse, section)
          .filter((column: DisplayColumn) => !isGuest || get(column, 'ShowForGuest') !== false);

        const lineItemCols = forSection(DisplayColumnSection.CartLineItem);
        // Feed the shared view so the Edit Layout chooser offers exactly the fields being rendered;
        // an empty set clears any configuration a previous cart applied.
        this.userViewMappingService.applyConfiguredColumns(lineItemCols.map((column: DisplayColumn) => ({
          fieldName: get(column, 'FieldName'),
          label: get(column, 'Label'),
          sequence: get(column, 'Sequence', 0),
          isSelected: true,
          isEditable: get(column, 'IsEditable', false)
        })));

        const priceCols = forSection(DisplayColumnSection.LineItemPrice);
        if (priceCols.length > 0) this.priceColumns = priceCols;

        const cartCols = forSection(DisplayColumnSection.CartSummary);
        if (cartCols.length > 0) this.cartColumns = cartCols;

        this.actions.applyOverrides(actionsResponse);
        this.refreshCartActions();
        this.cdr.detectChanges();
      })
    );
  }

  // Recomputes the header cart actions so the price-summary input holds a stable array reference.
  private refreshCartActions(): void {
    this.cartMainActions = this.actions.inArea(this.actionArea.Main);
  }

  ngOnInit() {
    // Activate the cart on direct load/refresh; the DSR CartService skips the startup load.
    if (isNil(this.cartService.getCart())) {
      this.cartService.refreshCart();
    }

    this.loadDisplayActions();
    this.refreshCartActions();
    this.subscriptions.push(this.userService.isLoggedIn().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      this.refreshCartActions();
      this.cdr.detectChanges();
    }));
    this.subscriptions.push(combineLatest([
      this.cartService.getMyCart(),
      this.crService.getRecommendationsForCart(),
      this.cartService.isCartActive(get(this.activatedRoute.params, "_value.id")) ? of(null) : this.cartService.fetchCartInfo(get(this.activatedRoute.params, "_value.id"), 'summary-groups,price-breakups,line-items,line-items.product,usage-tiers,adjustments'),
      this.revalidateCartService.revalidateFlag,
      this.batchSelectionService.getSelectedLineItems()]).pipe(
        switchMap(([cart, products, nonActiveCart, revalidateFlag, selectedCount]) => {
          this.selectedCount = selectedCount?.length ? selectedCount.length : 0;
          this.disabled = revalidateFlag;
          this.readOnly = get(cart, 'Id') === get(nonActiveCart, 'Id') || isNull(nonActiveCart) ? false : true;
          if (this.readOnly) {
            this.batchActionService.setShowCloneAction(true);
          } else {
            this.batchActionService.setShowCloneAction(false);
          }
          cart = this.readOnly ? nonActiveCart : cart;
          this.isCartFinalized = get(cart, 'Status') === 'Finalized';
          this.cart = cart;
          this.primaryLI = filter((get(cart, 'LineItems')), (i) => i.IsPrimaryLine && i.LineType === 'Product/Service');
          const businessObjectId = get(cart, 'BusinessObjectId');
          const isProposal = isEqual(get(cart, 'BusinessObjectType'), 'Proposal');
          const businessObject = isProposal ? get(cart, 'Proposald') : get(cart, 'Order');
          if (this.isCartFinalized || (!isNil(businessObjectId) && isNil(businessObject))) {
            this.businessObject$ = isEqual(get(cart, 'BusinessObjectType'), 'Proposal') ?
              this.quoteService.getQuoteById(get(cart, 'BusinessObjectId'), false) : this.orderService.getOrder(get(cart, 'BusinessObjectId'), null);
          } else {
            this.businessObject$ = of(null);
          }
          return combineLatest([of(this.cart), this.businessObject$, of(products)]);
        }),
        switchMap(([cartInfo, businessObjectInfo, productsInfo]) => {
          const businessObjectType = get(cartInfo, 'BusinessObjectType');
          const proposalId = get(cartInfo, 'Proposald');
          const orderId = get(cartInfo, 'Order');
          if (isEqual(businessObjectType, 'Proposal')) {
            if (isNil(proposalId) || this.isCartFinalized) set(cartInfo, 'Proposald', businessObjectInfo);
          }
          else if (isNil(orderId) || this.isCartFinalized) {
            set(cartInfo, 'Order', businessObjectInfo);
          }
          return of({
            cart: cartInfo,
            lineItems: LineItemService.groupItems(get(cartInfo, 'LineItems')),
            orderOrQuote: isNil(get(cartInfo, 'Order')) ? get(cartInfo, 'Proposald') : get(cartInfo, 'Order'),
            productList: productsInfo,
            headerInfo: Object.assign(new Cart(), {
              Id: this.cart.Id,
              Name: this.cart.Name
            })
          } as ManageCartState);
        })
      ).subscribe(cartState => this.view$.next(cartState)))
  }

  trackById(index, record): string {
    return get(record, 'MainLine.Id');
  }

  // Resolves the record a configured summary column binds to.
  recordForColumn(record: Cart, fieldName: string) {
    return this.displayColumnService.recordForColumn(record, fieldName);
  }

  // Returns the leaf field name for a possibly dotted configured FieldName.
  fieldForColumn(fieldName: string): string {
    return this.displayColumnService.fieldForColumn(fieldName);
  }

  /** @ignore */
  trackByFieldName(_index: number, column: DisplayColumn): string {
    return get(column, 'FieldName');
  }

  refreshCart(fieldValue, cart, fieldName) {
    set(cart, fieldName, fieldValue);
    const payload = {
      "Name": fieldValue
    }

    this.subscriptions.push(this.cartService.updateCartById(cart.Id, payload).subscribe(r => {
      if (!isNil(r)) this.cart = r;
      this.view$.value.headerInfo = Object.assign(new Cart(), {
        Id: this.cart.Id,
        Name: this.cart.Name
      });
    }))
  }
  createQuote(cart: Cart) {
    this.quoteService.convertCartToQuote(cart.Proposald).pipe(take(1)).subscribe(
      res => {
        this.quoteConfirmation = res;
        this.ngZone.run(() => {
          this.router.navigate(['/proposals', this.quoteConfirmation.Id]);
        });
      }
    );
  }
  searchChange() {
    if (this.searchText.length > 2) {
      forEach(this.view$.value.lineItems, (lineItem) => {
        let lowercaseSearchTerm = lowerCase(get(lineItem, 'MainLine.Name'));
        if (lowercaseSearchTerm) {
          if (lowercaseSearchTerm.indexOf(lowerCase(this.searchText)) > -1) {
            lineItem.MainLine.set('hide', false);
          }
          else {
            lineItem.MainLine.set('hide', true);
          }
        }
      });
    } else {
      forEach(this.view$.value.lineItems, (lineItem) => {
        lineItem.MainLine.set('hide', false);
      });
    }
  }

  openCloneCartModal() {
    this.cartName = `Clone of ${this.cart.Name}`
    this.modalRef = this.modalService.show(this.cloneCartTemplate);
  }

  closeCloneCartModal() {
    this.cartName = '';
    this.modalRef.hide()
  }

  cloneCart() {
    this.loading = true;
    if (this.cartName) {
      this.cart.Name = this.cartName
    }
    this.cartService.cloneCart(this.cart.Id, pick(this.cart, ['Name']) as Cart, false, true).pipe(take(1)).subscribe(
      res => {
        this.loading = false;
        this.modalRef.hide();
        this.exceptionService.showSuccess('SUCCESS.CART.CLONE_CART_SUCCESS');
      },
      err => {
        this.loading = false;
        this.exceptionService.showError('MY_ACCOUNT.CART_LIST.CART_CREATION_FAILED');
      }
    );
  }

  convertCartToQuote(quote: Quote) {
    this.quoteService.convertCartToQuote(quote).pipe(take(1)).subscribe(
      res => {
        this.loading = false;
        this.quoteConfirmation = res;
        this.ngZone.run(() => {
          this.router.navigate(['/proposals', this.quoteConfirmation.Id]);
        });
      },
      err => {
        this.loading = false;
      }
    );
  }

  openNav() {
    this.showSideNav = true;
  }

  /* Set the width of the side navigation to 0 */
  closeNav() {
    this.showSideNav = false;
  }

  ngOnDestroy() {
    if (!isNil(this.subscriptions))
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

/** @ignore */
export interface ManageCartState {
  cart: Cart;
  lineItems: Array<ItemGroup>;
  productList: Array<ItemRequest>;
  headerInfo: Cart;
}