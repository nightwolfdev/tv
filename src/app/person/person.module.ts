import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PersonRoutingModule } from './person-routing.module';

import { PersonComponent } from './person.component';

@NgModule({
  declarations: [
    PersonComponent
  ],
  imports: [
    CommonModule,
    PersonRoutingModule
  ]
})
export class PersonModule { }
