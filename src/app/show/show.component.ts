import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Show, TvService } from '../shared/services/tv.service';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss']
})
export class ShowComponent implements OnInit {
  error: boolean;
  notFound: boolean;
  show$: Observable<null | Show>;

  constructor(
    private route: ActivatedRoute,
    private tvSvc: TvService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');

      this.tvSvc.changeShow(id);

      this.show$ = this.tvSvc.show$.pipe(
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
