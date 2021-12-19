import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import { TvService } from '../shared/services/tv.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  searchResults$: Observable<any[] | null>;
 
  constructor(public tvSvc: TvService) {}

  ngOnInit(): void {
    this.searchResults$ = this.tvSvc.searchResults$;
  }
}
