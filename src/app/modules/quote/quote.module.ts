import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LaddaModule } from 'angular2-ladda';
import { TranslateModule } from '@ngx-translate/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { CongaModule } from '@congarevenuecloud/core';
import { PricingModule } from '@congarevenuecloud/ecommerce';
import {
  PriceModule, BreadcrumbModule, InputFieldModule, AddressModule, IconModule, LineItemTableRowModule,
  PriceSummaryModule, ButtonModule, OutputFieldModule, FileUploaderModule, CommentsModule
} from '@congarevenuecloud/elements';

import { DetailsModule } from '../details/details.module';
import { ComponentModule } from '../../components/component.module';
import { QuoteRoutingModule } from './quote-routing.module';
import { QuoteDetailsComponent } from './layout/quote-details/quote-details.component';

@NgModule({
  imports: [
    CommonModule,
    TooltipModule,
    CongaModule,
    QuoteRoutingModule,
    FormsModule,
    PriceModule,
    PricingModule,
    TabsModule,
    BsDatepickerModule,
    BreadcrumbModule,
    InputFieldModule,
    AddressModule,
    IconModule,
    DetailsModule,
    TranslateModule.forChild(),
    OutputFieldModule,
    LineItemTableRowModule,
    LaddaModule,
    NgScrollbarModule,
    PriceSummaryModule,
    ButtonModule,
    FileUploaderModule,
    ComponentModule,
    CommentsModule
  ],
  declarations: [QuoteDetailsComponent]
})
export class QuoteModule { }
