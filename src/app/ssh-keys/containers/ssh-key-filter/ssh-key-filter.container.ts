import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { State } from '../../../reducers';
import { FilterService } from '../../../shared/services/filter.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionStorageService } from '../../../shared/services/session-storage.service';
import { WithUnsubscribe } from '../../../utils/mixins/with-unsubscribe';
import { sshKeyGroupings } from '../ssh-key-page/ssh-key-page.container';
import { AuthService } from '../../../shared/services/auth.service';
import { Grouping } from '../../../shared/models';

import * as accountAction from '../../../reducers/accounts/redux/accounts.actions';
import * as sshKeyActions from '../../../reducers/ssh-keys/redux/ssh-key.actions';
import * as fromSshKeys from '../../../reducers/ssh-keys/redux/ssh-key.reducers';
import * as fromAccounts from '../../../reducers/accounts/redux/accounts.reducers';

const FILTER_KEY = 'sshKeyListFilters';

@Component({
  selector: 'cs-ssh-key-filter-container',
  template: `
    <cs-ssh-key-filter
      *loading="loading$ | async"
      [accounts]="accounts$ | async"
      [selectedAccountIds]="selectedAccountIds$ | async"
      [selectedGroupings]="selectedGroupings$ | async"
      [groupings]="groupings"
      (onGroupingsChange)="onGroupingsChange($event)"
      (onAccountsChange)="onAccountsChange($event)"
    ></cs-ssh-key-filter>`
})
export class ShhKeyFilterContainerComponent extends WithUnsubscribe() implements OnInit {

  public groupings: Array<Grouping> = sshKeyGroupings;

  readonly filters$ = this.store.select(fromSshKeys.filters);
  readonly loading$ = this.store.select(fromSshKeys.isLoading);
  readonly accounts$ = this.store.select(fromAccounts.selectAll);
  readonly selectedGroupings$ = this.store.select(fromSshKeys.filterSelectedGroupings);
  readonly selectedAccountIds$ = this.store.select(fromSshKeys.filterSelectedAccountIds);

  private filterService = new FilterService(
    {
      'accounts': { type: 'array', defaultOption: [] },
      'groupings': { type: 'array', defaultOption: [] }
    },
    this.router,
    this.sessionStorage,
    FILTER_KEY,
    this.activatedRoute
  );

  constructor(
    private authService: AuthService,
    private store: Store<State>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sessionStorage: SessionStorageService
  ) {
    super();
  }

  public onGroupingsChange(selectedGroupings: Array<Grouping>) {
    this.store.dispatch(new sshKeyActions.SshKeyFilterUpdate({ selectedGroupings }));
  }

  public onAccountsChange(selectedAccountIds: Array<string>) {
    this.store.dispatch(new sshKeyActions.SshKeyFilterUpdate({ selectedAccountIds }));
  }

  public ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.groupings = this.groupings.filter(g => g.key !== 'accounts');
    }
    this.store.dispatch(new accountAction.LoadAccountsRequest());
    this.initFilters();
  }

  private initFilters(): void {
    const params = this.filterService.getParams();
    const selectedGroupings = params['groupings'].reduce((acc, group) => {
      const grouping = this.groupings.find(g => {
        return g.key === group;
      });
      if (grouping) {
        acc.push(grouping);
      }
      return acc;
    }, []);

    const selectedAccountIds = params['accounts'];

    this.store.dispatch(new sshKeyActions.SshKeyFilterUpdate({
      selectedAccountIds,
      selectedGroupings
    }));

    this.filters$
      .takeUntil(this.unsubscribe$)
      .subscribe(filters => this.filterService.update({
        'groupings': filters.selectedGroupings.map(g => g.key),
        'accounts': filters.selectedAccountIds
      }));
  }
}
