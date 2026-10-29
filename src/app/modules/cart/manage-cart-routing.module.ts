/**
 * Conga Digital Commerce
 *
 * Dedicated routing module for the manage cart module.
 */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ManageCartComponent } from './layout/manage-cart.component';

const routes: Routes = [
  {
    path: 'active',
    component: ManageCartComponent
  },
  {
    path: '',
    redirectTo: 'active',
    pathMatch: 'full'
  }
];

/**
 * @internal
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManageCartRoutingModule {}
