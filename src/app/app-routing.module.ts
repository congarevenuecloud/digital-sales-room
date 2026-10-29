import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthorizationGuard } from './auth/auth.guard';
import { DsrEntryGuard } from './guards/dsr-entry.guard';
import { MainComponent } from './main.component';
import { DsrUnauthorizedComponent } from './components/dsr-unauthorized/dsr-unauthorized.component';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        canActivate: [AuthorizationGuard],
        component: MainComponent,
        children: [
          {
            path: '',
            redirectTo: 'proposals',
            pathMatch: 'full'
          },
          {
            path: 'products',
            canActivate: [DsrEntryGuard],
            loadChildren: () => import('./modules/catalog/catalog.module').then(m => m.CatalogModule),
            data: { title: 'Catalog' }
          },
          {
            path: 'search/:query',
            canActivate: [DsrEntryGuard],
            loadChildren: () => import('./modules/catalog/catalog.module').then(m => m.CatalogModule),
            data: { title: 'Search' }
          },
          {
            path: 'carts',
            canActivate: [DsrEntryGuard],
            loadChildren: () => import('./modules/cart/manage-cart.module').then(m => m.ManageCartModule),
            data: { title: 'Cart' }
          },
          {
            path: 'proposals',
            loadChildren: () => import('./modules/quote/quote.module').then(m => m.QuoteModule),
            data: { title: 'Quotes' }
          },
          {
            path: 'dsr-unauthorized',
            component: DsrUnauthorizedComponent,
            data: { title: 'Access Restricted' }
          }
        ]
      },
      {
        path: '**',
        redirectTo: '',
      },
    ], {
      useHash: environment.hashRouting,
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
