import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslatorLoaderService, CommerceModule, CartService, AccountService, PriceListService } from '@congarevenuecloud/ecommerce';
import { TableModule, CongaModalModule, IconModule, ProductDrawerModule, ErrorPageModule } from '@congarevenuecloud/elements';
import { AuthConfigModule } from './auth/auth-config.module';
import { AuthorizationGuard } from './auth/auth.guard';
import { AppRoutingModule } from './app-routing.module';
import { ComponentModule } from './components/component.module';
import { MainComponent } from './main.component';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { dsrCartServiceFactory, dsrCartServiceFactoryDeps } from './services/dsr-cart-service.factory';
import { DsrAccountService } from './services/dsr-account.service';
import { DsrPriceListService } from './services/dsr-price-list.service';
import { DsrAccessTypeInterceptor } from './interceptors/dsr-access-type.interceptor';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';
import localeFrExtras from '@angular/common/locales/extra/fr';
import localeEsExtras from '@angular/common/locales/extra/es';

registerLocaleData(localeFr, 'fr-FR', localeFrExtras);
registerLocaleData(localeEs, 'es-MX', localeEsExtras);

@NgModule({
  declarations: [
    AppComponent,
    MainComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CommerceModule.forRoot(environment),
    TranslateModule.forRoot({
      loader: { provide: TranslateLoader, useClass: TranslatorLoaderService }
    }),
    TableModule,
    ComponentModule,
    ProductDrawerModule,
    CongaModalModule,
    IconModule,
    AuthConfigModule,
    ErrorPageModule
  ],
  providers: [
    AuthorizationGuard,
    // Override the default CartService so it does not auto-load a cart on startup.
    // The DSR quote detail entry point needs no live cart; the cart is prepared
    // on demand by the Edit/Add flows. Avoids unnecessary calls for reviewers who
    // only have read access.
    { provide: CartService, useFactory: dsrCartServiceFactory, deps: dsrCartServiceFactoryDeps },
    // Override the default AccountService so the active account is published
    // independently of a live cart. The DSR CartService performs no startup cart
    // load, so the base AccountService (which waits on getMyCart()) would never
    // publish an account and account-dependent streams would hang. See
    // dsr-account.service.ts.
    { provide: AccountService, useClass: DsrAccountService },
    // Override the default PriceListService so the active price list follows the
    // quote being viewed rather than the collaborator's account. Consumers like
    // the category sidebar wait on getPriceListId(); this keeps them aligned to
    // the quote's price list. See dsr-price-list.service.ts.
    { provide: PriceListService, useClass: DsrPriceListService },
    // Suppress background calls that are not permitted while rendering the
    // read-only quote detail page for an Accept/Reject reviewer, so no spurious
    // error toasters appear. Scoped strictly to that access type and to specific
    // endpoints. See dsr-access-type.interceptor.ts.
    { provide: HTTP_INTERCEPTORS, useClass: DsrAccessTypeInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
