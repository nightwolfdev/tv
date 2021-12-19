import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Person, TvService } from '../shared/services/tv.service';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {
  error: boolean;
  notFound: boolean;
  person$: Observable<null | Person>;

  constructor(
    private route: ActivatedRoute,
    private tvSvc: TvService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');

      this.tvSvc.changePerson(id);

      this.person$ = this.tvSvc.person$.pipe(
        catchError(error => {
          console.error(error);

          this.error = ![200, 404].includes(error.status);
          this.notFound = error.status === 404;

          return throwError(() => error.message);
        })
      );
    });
  }
}
