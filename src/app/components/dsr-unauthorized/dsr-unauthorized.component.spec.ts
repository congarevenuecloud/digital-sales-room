import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { DsrUnauthorizedComponent } from './dsr-unauthorized.component';

describe('DsrUnauthorizedComponent', () => {
  let route: ActivatedRoute;
  let component: DsrUnauthorizedComponent;

  beforeEach(() => {
    route = new ActivatedRoute();
    route.snapshot = new ActivatedRouteSnapshot();
    component = new DsrUnauthorizedComponent(route);
  });

  it('starts without an attempted URL', () => {
    expect(component.attemptedUrl).toBeNull();
  });

  it('reads the attempted URL from the returnUrl query parameter', () => {
    route.snapshot.queryParams = { returnUrl: '/quote/123' };

    component.ngOnInit();

    expect(component.attemptedUrl).toBe('/quote/123');
  });

  it('keeps the attempted URL empty when no returnUrl is supplied', () => {
    component.ngOnInit();

    expect(component.attemptedUrl).toBeNull();
  });
});
