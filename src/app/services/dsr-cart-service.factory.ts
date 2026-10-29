import { Injector } from '@angular/core';
import { ApiService, CacheService, ConfigurationService, MetadataService } from '@congarevenuecloud/core';
import { CartService, CartGraphQLService, FeatureService } from '@congarevenuecloud/ecommerce';

/**
 * Builds the root `CartService` (honouring the `EnableGraphQL` flag) but skips
 * the default startup cart refresh, which is unnecessary for the DSR read-only
 * quote detail entry point and not permitted for AcceptReject reviewers. The
 * Edit/Add flows activate a cart on demand. Registered in AppModule for the DSR
 * app only.
 */
export function dsrCartServiceFactory(
    featureService: FeatureService,
    cacheService: CacheService,
    apiService: ApiService,
    metadataService: MetadataService,
    configService: ConfigurationService,
    injector: Injector
): CartService {
    const service: CartService = featureService.hasFeature('EnableGraphQL')
        ? new CartGraphQLService(cacheService, apiService, metadataService, configService, injector)
        : new CartService(cacheService, apiService, metadataService, configService, injector);

    // No startup cart call; carts are activated on demand by the Edit/Add flows.
    return service;
}

/** Dependency list for {@link dsrCartServiceFactory}. */
export const dsrCartServiceFactoryDeps = [
    FeatureService, CacheService, ApiService, MetadataService, ConfigurationService, Injector
];
