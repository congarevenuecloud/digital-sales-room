import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { LaddaModule } from 'angular2-ladda';
import { TranslateModule } from '@ngx-translate/core';
import { CongaModule } from '@congarevenuecloud/core';
import {
  MiniProfileModule, MiniCartModule, OutputFieldModule, ButtonModule,
  DirectivesModule, ProductSearchModule, IconModule, ConstraintRuleModule, InputFieldModule, PipesModule
} from '@congarevenuecloud/elements';
import { HeaderComponent } from './header/header.component';
import { ProgressComponent } from './progress/progress.component';
import { DsrUnauthorizedComponent } from './dsr-unauthorized/dsr-unauthorized.component';

@NgModule({
  imports: [
    CommonModule,
    ModalModule,
    MiniProfileModule,
    MiniCartModule,
    LaddaModule,
    IconModule,
    RouterModule,
    ConstraintRuleModule,
    NgScrollbarModule,
    TranslateModule,
    TooltipModule,
    ToastrModule.forRoot({ onActivateTick: true }),
    OutputFieldModule,
    ButtonModule,
    DirectivesModule,
    ProductSearchModule,
    CongaModule,
    InputFieldModule,
    PipesModule,
    FormsModule
  ],
  exports: [
    HeaderComponent,
    LaddaModule,
    ToastrModule,
    ConstraintRuleModule,
    ProgressComponent,
    DsrUnauthorizedComponent
  ],
  declarations: [
    HeaderComponent,
    ProgressComponent,
    DsrUnauthorizedComponent
  ]
})
export class ComponentModule { }
