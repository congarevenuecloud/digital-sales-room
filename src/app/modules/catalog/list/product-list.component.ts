import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { get, isNil, isEmpty, toString, toNumber } from 'lodash';
import { PlatformConstants, ConfigurationService } from '@congarevenuecloud/core';
import {
  Category,
  ProductService,
  ProductResult,
  PreviousState,
  FieldFilter,
  CategoryService,
  Product,
  FacetFilter,
  FacetFilterPayload,
  CartService,
  StorefrontService
} from '@congarevenuecloud/ecommerce';
import { BatchSelectionService, ExceptionService } from '@congarevenuecloud/elements';

@Component({
  standalone: false,
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  page = 1;
  pageSize = 12;
  view = 'grid';
  sortField: string = 'Name';
  subCategories: Array<Category> = [];
  searchString: string = null;
  data$: BehaviorSubject<ProductResult> = new BehaviorSubject<ProductResult>(null);
  category: Category;
  subscriptions: Array<Subscription> = [];
  hasSearchError: boolean;
  moveToLast: boolean = false;
  productResult: PreviousState;
  product = new Product();
  facetFilterPayload: FacetFilterPayload;

  private static VIEW_KEY: string = PlatformConstants.PAGE_VIEW;
  private static PAGESIZE_KEY: string = PlatformConstants.PAGE_SIZE;

  paginationButtonLabels: any = {
    first: '',
    previous: '',
    next: '',
    last: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private storefrontService: StorefrontService,
    private translateService: TranslateService,
    private batchSelectionService: BatchSelectionService,
    private exceptionService: ExceptionService,
    private configurationService: ConfigurationService
  ) { }

  ngOnInit() {
    // Activate the cart on direct load/refresh; the DSR CartService skips the startup load.
    if (isNil(this.cartService.getCart())) {
      this.cartService.refreshCart();
    }

    this.subscriptions.push(
      this.route.params.pipe(
        mergeMap(params => {
          this.searchString = get(params, 'query');
          const categoryId = get(params, 'categoryId');
          // Resolve the primary category from the route; reset subcategory
          // selection and pagination when it changes.
          if (categoryId) {
            this.category = new Category();
            this.category.Id = categoryId;
          } else {
            this.category = null;
          }
          this.subCategories = [];
          this.page = 1;
          return this.getProducts();
        })
      ).subscribe()
    );

    // Set pagination labels
    this.translateService.stream('PAGINATION').subscribe(labels => {
      if (labels) {
        this.paginationButtonLabels = {
          first: labels.FIRST || '',
          previous: labels.PREVIOUS || '',
          next: labels.NEXT || '',
          last: labels.LAST || ''
        };
      }
    });

    // Restore view preference
    const savedView = localStorage.getItem(ProductListComponent.VIEW_KEY);
    if (savedView) {
      this.view = savedView;
    }
  }

  getProducts(): Observable<ProductResult> {
    // Build the category filter from component state (selected subcategories, else
    // the route category, else none) so paging/sort/facet changes keep the active
    // category.
    let categories: Array<string> = [];
    if (!isEmpty(this.subCategories)) {
      categories = this.subCategories.map(category => category.Id);
    } else if (get(this.category, 'Id')) {
      categories = [this.category.Id];
    }
    const filters: Array<FieldFilter> = [];

    return this.productService.getProducts(
      categories,
      this.pageSize,
      this.page,
      this.sortField,
      'ASC',
      this.searchString,
      true,
      true,
      filters,
      this.facetFilterPayload
    ).pipe(
      map((result: ProductResult) => {
        this.data$.next(result);
        return result;
      })
    );
  }

  onPage(event: any): void {
    this.page = event.page;
    this.getProducts().subscribe();
  }

  onView(view: string): void {
    this.view = view;
    localStorage.setItem(ProductListComponent.VIEW_KEY, view);
  }

  onSortChange(sortField: string): void {
    this.sortField = sortField;
    this.page = 1;
    this.getProducts().subscribe();
  }

  onPageSizeChange(size: string): void {
    this.pageSize = toNumber(size);
    this.page = 1;
    localStorage.setItem(ProductListComponent.PAGESIZE_KEY, size);
    this.getProducts().subscribe();
  }

  /**
   * Handles selection from the "Related Categories" (peers) filter.
   * `<apt-category-filter>` emits `Array<Category>`, so read the first element.
   */
  onCategory(categoryList: Array<Category>): void {
    const category: Category = get(categoryList, '[0]');
    this.page = 1;
    this.subCategories = [];
    if (category) {
      this.router.navigate(['/products/category', category.Id]);
    } else {
      this.category = null;
      this.router.navigate(['/products']);
    }
  }

  onSubcategoryFilter(categories: Array<Category>): void {
    this.subCategories = categories;
    this.page = 1;
    this.getProducts().subscribe();
  }

  getFacetFilterSelection(payload: FacetFilterPayload): void {
    this.facetFilterPayload = payload;
    this.page = 1;
    this.getProducts().subscribe();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
