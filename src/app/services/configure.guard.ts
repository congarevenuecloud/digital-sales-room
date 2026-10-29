import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { get } from 'lodash';
import { ProductConfigurationService } from '@congarevenuecloud/elements';

@Injectable({
  providedIn: 'root',
})
export class ConfigureGuard {

  constructor(private productConfigService: ProductConfigurationService) { }

  canDeactivate(component: any): Observable<boolean> | Promise<boolean> | boolean {
    if (get(component, 'unsavedConfiguration')) {
      if (confirm('There are unsaved changes in progress in your configuration. Do you want to discard these changes?')) {
        this.productConfigService.unsavedConfiguration.next(false);
        return of(true);
      } else {
        return of(false);
      }
    }
    return of(true);
  }
}
