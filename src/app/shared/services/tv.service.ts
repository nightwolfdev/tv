import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

export interface CastCredit {
  _embedded: {
    show: Show;
  };
}

export interface Character {
  id: number;
  image: {
    medium?: string;
    original?: string;
  };
  name: string;
}

export interface Network {
  country: {
    code: string;
    name: string;
    timezone: string;
  }
  id: number;
  name: string;
}

export interface Person {
  birthday: string;
  country: {
    code: string;
    name: string;
    timezone: string;
  };
  deathday: string;
  gender: string;
  id: string;
  image: {
    medium?: string;
    original?: string;
  };
  name: string;
  shows: Show[];
}

export interface SearchCriteria {
  term: string;
  type: string;
}

export interface Season {
  endDate: string;
  id: number;
  image: {
    medium?: string;
    original?: string;
  };
  number: number;
  premiereDate: string;
  summary: SafeHtml;
}

export interface Show {
  _embedded?: {
    cast?: {
      character: Character;
      person: Person;
    }[];
    seasons?: Season[];
  }
  ended: string;
  genres: string[];
  id: number;
  image: {
    medium?: string;
    original?: string;
  };
  language: string;
  name: string;
  network: Network;
  officialSite: string;
  premiered: string;
  rating: {
    average: number;
  };
  runtime: number;
  searchType: string;
  status: string;
  summary: SafeHtml;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class TvService {
  private readonly host = 'https://api.tvmaze.com';

  private readonly searchCriteriaCache = new BehaviorSubject<SearchCriteria>({ term: '', type: '' });
  private readonly searchResultsCache = new BehaviorSubject<Person[] | Show[] | null>(null);

  private readonly changePersonCache = new BehaviorSubject<null | number | string>(null);
  private readonly changeShowCache = new BehaviorSubject<null | number | string>(null);

  private readonly personCache = new BehaviorSubject<null | Person>(null);
  private readonly showCache = new BehaviorSubject<null | Show>(null);

  readonly person$: Observable<null | Person> = this.personCache.asObservable();
  readonly searchResults$: Observable<Person[] | Show[] | null> = this.searchResultsCache.asObservable();
  readonly show$: Observable<null | Show> = this.showCache.asObservable();

  searchResultsError: boolean;
  searchResultsLoading: boolean;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    this.getPerson().subscribe();
    this.getShow().subscribe();
    this.searchResults().subscribe();
  }

  private getPerson(): Observable<Person> {
    return this.changePersonCache.asObservable()
      .pipe(
        filter(id => !!id),
        distinctUntilChanged(),
        tap(() => this.personCache.next(null)),
        switchMap(id => forkJoin([
            this.http.get<Person>(`${this.host}/people/${id}`),
            this.http.get<CastCredit[]>(`${this.host}/people/${id}/castcredits?embed=show`)
          ]).pipe(
            map(([person, castCredits]) => {
              const shows = castCredits.map(entry => entry._embedded.show).sort((a, b) => {
                if (a.name < b.name) {
                  return -1;
                }
                if (a.name > b.name) {
                  return 1;
                }
                return 0;
              });

              return {...person, shows};
            }),
            tap(person => this.personCache.next(person))
          )
        )
      );
  }

  private getShow(): Observable<Show> {
    return this.changeShowCache.asObservable()
      .pipe(
        filter(id => !!id),
        distinctUntilChanged(),
        tap(() => this.showCache.next(null)),
        switchMap(id => this.http
          .get<Show>(`${this.host}/shows/${id}?embed[]=cast&embed[]=seasons`)
          .pipe(
            map(show => this.mapShow(show)),
            tap(show => this.showCache.next(show))
          )
        )
      );
  }  

  private mapShow(show: Show): Show {
    show?._embedded?.cast?.sort((a, b) => {
      if (a.person.name < b.person.name) {
        return -1;
      }
      if (a.person.name > b.person.name) {
        return 1;
      }
      return 0;
    });

    if (show?._embedded?.seasons) {
      show?._embedded?.seasons.forEach(season => season.summary = this.sanitizer.bypassSecurityTrustHtml(season.summary as string))
    }

    if (show?.summary) {
      show.summary = this.sanitizer.bypassSecurityTrustHtml(show.summary as string);
    }

    show.searchType = 'shows';

    return show;
  }

  private searchPeople(term: string): Observable<Person[]> {
    return this.http
      .get<{score: number, person: Person}[]>(`${this.host}/search/people?q=${encodeURIComponent(term)}`)
      .pipe(
        map(response => response.map(entry => entry.person).sort(this.sortNames)),
        tap(() => this.searchResultsLoading = false),
        catchError(error => {
          console.error(error);
          this.searchResultsError = true;
          this.searchResultsLoading = false;
          return of([]);
        })
      );
  }

  private searchShows(term: string): Observable<Show[]> {
    return this.http
      .get<{score: number, show: Show}[]>(`${this.host}/search/shows?q=${encodeURIComponent(term)}`)
      .pipe(
        map(response => response.map(entry => entry.show)),
        map(shows => {
          shows.forEach(show => {
            show = this.mapShow(show);
          });

          return shows.sort(this.sortNames);
        }),
        tap(() => this.searchResultsLoading = false),
        catchError(error => {
          console.error(error);
          this.searchResultsError = true;
          this.searchResultsLoading = false;
          return of([]);
        })
      );
  }

  private searchResults(): Observable<Person[] | Show[]> {
    return this.searchCriteriaCache.asObservable()
      .pipe(
        filter(searchCriteria => !!searchCriteria.term && !!searchCriteria.type),
        tap(() => {
          this.searchResultsCache.next(null);
          this.searchResultsError = false;
          this.searchResultsLoading = true;
        }),
        switchMap(searchCriteria => searchCriteria.type === 'people'
          ? this.searchPeople(searchCriteria.term)
          : this.searchShows(searchCriteria.term)
        ),
        tap(searchResults => this.searchResultsCache.next(searchResults))
      );
  }

  private sortNames(a: Person | Show, b: Person | Show): number {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  changePerson(id: null | number | string): void {
    this.changePersonCache.next(id);
  }

  changeShow(id: null | number | string): void {
    this.changeShowCache.next(id);
  }

  search(searchCriteria: SearchCriteria): void {
    this.searchCriteriaCache.next(searchCriteria);
    this.router.navigateByUrl('/');
  } 
}
