import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import { TvService } from './shared/services/tv.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  form: UntypedFormGroup;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private tvSvc: TvService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      term: [''],
      type: ['shows']
    });
  }

  search(): void {
    const term = this.form.get('term')?.value;
    const type = this.form.get('type')?.value;

    this.tvSvc.search({ term, type });
  }
}
