import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { QuoteDetailsComponent } from './layout/quote-details/quote-details.component';
import { CollaborationAuthGuard } from '../../guards/collaboration-auth.guard';

const routes: Routes = [
  {
    path: ':id',
    component: QuoteDetailsComponent,
    canActivate: [CollaborationAuthGuard]
  },
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class QuoteRoutingModule { }
