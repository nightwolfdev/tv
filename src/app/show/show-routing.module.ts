import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShowComponent } from './show.component';

const routes: Routes = [
  {
    path: ':id',
    component: ShowComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShowRoutingModule { }
