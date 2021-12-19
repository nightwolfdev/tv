import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { TvService } from './shared/services/tv.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
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
