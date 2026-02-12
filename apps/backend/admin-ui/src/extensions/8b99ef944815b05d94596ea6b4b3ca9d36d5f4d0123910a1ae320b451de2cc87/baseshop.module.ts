import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@vendure/admin-ui/core';
import { BaseShopConfigComponent } from './components/base-shop-config.component';

@NgModule({
  imports: [
    SharedModule,
    BaseShopConfigComponent,
    RouterModule.forChild([
      {
        path: '',
        component: BaseShopConfigComponent,
      },
    ]),
  ],
  declarations: [],
})
export class BaseShopModule {}
