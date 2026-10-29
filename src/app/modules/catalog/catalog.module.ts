import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { PaginationModule } from 'ngx-bootstrap/pagination';

import { PricingModule } from '@congarevenuecloud/ecommerce';
import { CongaModule } from '@congarevenuecloud/core';

import {
  BreadcrumbModule,
  ButtonModule,
  PriceModule,
  ProductCarouselModule,
  ProductConfigurationModule,
  IconModule,
  InputDateModule,
  ProductImagesModule,
  ConfigurationSummaryModule,
  ProductCardModule,
  FilterModule,
  InputFieldModule,
  ConstraintRuleModule,
  QuickAddModule,
  AlertModule,
  SelectAllModule,
  PipesModule,
  OutputFieldModule
} from '@congarevenuecloud/elements';

import { ComponentModule } from '../../components/component.module';
import { DetailsModule } from '../details/details.module';
import { CatalogRoutingModule } from './catalog-routing.module';
import { ProductListComponent } from './list/product-list.component';
import { ProductDetailComponent } from './detail/product-detail.component';
import { ResultsComponent } from './component/results.component';
import { TabFeaturesComponent } from './component/tab-features.component';

@NgModule({
  imports: [
    CommonModule,
    BreadcrumbModule,
    ProductCarouselModule,
    ProductConfigurationModule,
    ConfigurationSummaryModule,
    IconModule,
    InputDateModule,
    ProductImagesModule,
    ProductCardModule,
    FilterModule,
    InputFieldModule,
    ConstraintRuleModule,
    QuickAddModule,
    AlertModule,
    SelectAllModule,
    PipesModule,
    OutputFieldModule,
    CongaModule,
    PricingModule,
    FormsModule,
    TabsModule,
    PaginationModule,
    PriceModule,
    ButtonModule,
    ComponentModule,
    DetailsModule,
    TranslateModule.forChild(),
    CatalogRoutingModule
  ],
  declarations: [
    ProductListComponent,
    ProductDetailComponent,
    ResultsComponent,
    TabFeaturesComponent
  ]
})
export class CatalogModule { }
